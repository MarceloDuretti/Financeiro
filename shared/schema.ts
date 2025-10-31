import { sql } from "drizzle-orm";
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  bigint,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Supported banks for bank accounts and billing configurations
// Ensures consistent naming and codes across the system
export const SUPPORTED_BANKS = [
  {
    code: "001",
    name: "Banco do Brasil",
    shortName: "BB",
    color: "text-yellow-700 bg-yellow-50",
  },
  {
    code: "104",
    name: "Caixa Econômica Federal",
    shortName: "CEF",
    color: "text-blue-700 bg-blue-50",
  },
  {
    code: "237",
    name: "Bradesco",
    shortName: "Bradesco",
    color: "text-red-700 bg-red-50",
  },
  {
    code: "341",
    name: "Itaú",
    shortName: "Itaú",
    color: "text-orange-700 bg-orange-50",
  },
  {
    code: "033",
    name: "Santander",
    shortName: "Santander",
    color: "text-red-700 bg-red-50",
  },
  {
    code: "756",
    name: "Sicoob",
    shortName: "Sicoob",
    color: "text-green-700 bg-green-50",
  },
] as const;

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table for local authentication with admin/collaborator structure
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("collaborator"), // "admin" or "collaborator"
  adminId: varchar("admin_id"), // ID of the admin who created this user (null for admins)
  status: varchar("status").notNull().default("active"), // "active", "inactive", "pending_first_access"
  inviteToken: varchar("invite_token"), // Token for first-time password setup
  inviteTokenExpiry: timestamp("invite_token_expiry"), // Token expiration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const signupSchema = loginSchema.extend({
  firstName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  lastName: z.string().optional(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;

// Companies table for multi-company management with tenant isolation
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: integer("code").notNull(),
  tradeName: text("trade_name").notNull(),
  legalName: text("legal_name").notNull(),
  cnpj: text("cnpj").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("Ativa"),
  ie: text("ie"),
  im: text("im"),
  dataAbertura: text("data_abertura"),
  cnaePrincipal: text("cnae_principal"),
  cnaeSecundario: text("cnae_secundario"),
  regimeTributario: text("regime_tributario"),
  porte: text("porte"),
  logradouro: text("logradouro"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  uf: text("uf"),
  cep: text("cep"),
  email: text("email"),
  website: text("website"),
  responsavelNome: text("responsavel_nome"),
  responsavelCargo: text("responsavel_cargo"),
  responsavelTelefone: text("responsavel_telefone"),
  responsavelEmail: text("responsavel_email"),
  responsavelFoto: text("responsavel_foto"),
  isActive: boolean("is_active").default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  index("companies_tenant_idx").on(table.tenantId, table.id),
  uniqueIndex("companies_tenant_code_unique").on(table.tenantId, table.code),
  index("companies_tenant_updated_idx").on(table.tenantId, table.updatedAt),
  index("companies_tenant_deleted_idx").on(table.tenantId, table.deleted, table.id),
]);

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  updatedAt: true,
  version: true,
  deleted: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// User-Company relationship table (which companies a collaborator can access) with tenant isolation
export const userCompanies = pgTable("user_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  index("user_companies_tenant_idx").on(table.tenantId, table.userId, table.companyId),
  index("user_companies_tenant_updated_idx").on(table.tenantId, table.updatedAt),
]);

export const insertUserCompanySchema = createInsertSchema(userCompanies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  deleted: true,
});

export type InsertUserCompany = z.infer<typeof insertUserCompanySchema>;
export type UserCompany = typeof userCompanies.$inferSelect;

// Schema for creating a collaborator
export const createCollaboratorSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  lastName: z.string().optional(),
  companyIds: z.array(z.string()).min(1, "Selecione pelo menos uma empresa"),
});

export type CreateCollaboratorData = z.infer<typeof createCollaboratorSchema>;

// Schema for accepting invite (collaborator sets password)
export const acceptInviteSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type AcceptInviteData = z.infer<typeof acceptInviteSchema>;

// Company Members table - Team members within a specific company
export const companyMembers = pgTable("company_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // e.g., "Gerente Financeiro", "Assistente"
  phone: text("phone"),
  status: text("status").notNull().default("active"), // "active" or "inactive"
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  index("company_members_tenant_company_idx").on(table.tenantId, table.companyId, table.deleted, table.id),
  index("company_members_tenant_updated_idx").on(table.tenantId, table.updatedAt),
]);

export const insertCompanyMemberSchema = createInsertSchema(companyMembers).omit({
  id: true,
  tenantId: true,
  companyId: true,
  updatedAt: true,
  version: true,
  deleted: true,
});

export type InsertCompanyMember = z.infer<typeof insertCompanyMemberSchema>;
export type CompanyMember = typeof companyMembers.$inferSelect;

// Cost Centers table - For departmental/project cost allocation
export const costCenters = pgTable("cost_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: integer("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#3B82F6"), // Hex color for visual badges
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  index("cost_centers_tenant_idx").on(table.tenantId, table.deleted, table.id),
  uniqueIndex("cost_centers_tenant_code_unique").on(table.tenantId, table.code),
  index("cost_centers_tenant_updated_idx").on(table.tenantId, table.updatedAt),
]);

export const insertCostCenterSchema = createInsertSchema(costCenters).omit({
  id: true,
  tenantId: true,
  code: true,
  updatedAt: true,
  version: true,
  deleted: true,
});

export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;
export type CostCenter = typeof costCenters.$inferSelect;

// Chart of Accounts - Hierarchical account tree structure optimized for BigData
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: varchar("parent_id"), // Self-reference for hierarchy (null for root accounts)
  code: varchar("code").notNull(), // Hierarchical code: "1", "1.1", "1.1.1", "1.2", "2", etc.
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "receita", "despesa", "ativo", "passivo", "patrimonio_liquido"
  path: varchar("path").notNull(), // Materialized path for fast subtree queries (same as code for efficiency)
  depth: integer("depth").notNull().default(0), // 0 for root, 1 for first level, etc.
  fullPathName: text("full_path_name").notNull(), // Pre-computed full path: "Despesas > Operacionais > Aluguel"
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  // Primary index for tenant + path (fastest subtree queries)
  uniqueIndex("chart_accounts_tenant_path_unique").on(table.tenantId, table.path),
  // Index for finding children of a parent
  index("chart_accounts_tenant_parent_idx").on(table.tenantId, table.parentId, table.code),
  // Index for filtering by depth (level queries)
  index("chart_accounts_tenant_depth_idx").on(table.tenantId, table.deleted, table.depth),
  // Index for filtering by type
  index("chart_accounts_tenant_type_idx").on(table.tenantId, table.type, table.deleted),
  // Index for updates/sync
  index("chart_accounts_tenant_updated_idx").on(table.tenantId, table.updatedAt),
  // Composite index for tenant-scoped queries
  index("chart_accounts_tenant_deleted_idx").on(table.tenantId, table.deleted, table.id),
]);

export const insertChartAccountSchema = createInsertSchema(chartOfAccounts).omit({
  id: true,
  tenantId: true,
  code: true, // Auto-generated by backend with advisory locks
  path: true, // Computed from code
  depth: true, // Computed from parentId
  fullPathName: true, // Computed from parent chain
  updatedAt: true,
  version: true,
  deleted: true,
});

export type InsertChartAccount = z.infer<typeof insertChartAccountSchema>;
export type ChartAccount = typeof chartOfAccounts.$inferSelect;

// Bank Accounts table - For banking operations and automatic reconciliation
export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }), // Optional - can be personal account
  description: text("description").notNull(), // "Itaú Principal", "Nubank Reserva"
  bankName: text("bank_name").notNull(), // "Banco Itaú" - Must be from SUPPORTED_BANKS
  bankCode: text("bank_code").notNull(), // COMPE/ISPB code for integrations (e.g., "341" for Itaú) - Must be from SUPPORTED_BANKS
  accountType: text("account_type").notNull(), // "corrente", "poupanca", "pagamento"
  agencyNumber: text("agency_number").notNull(),
  agencyDigit: text("agency_digit"),
  accountNumber: text("account_number").notNull(),
  accountDigit: text("account_digit"),
  holderName: text("holder_name").notNull(), // Account owner name
  holderDocument: text("holder_document").notNull(), // CPF or CNPJ
  initialBalance: text("initial_balance").notNull().default("0"), // Stored as string to avoid float precision issues
  initialBalanceDate: timestamp("initial_balance_date").notNull(), // Critical for reconciliation
  currentBalance: text("current_balance").notNull().default("0"), // Updated by transactions
  currency: text("currency").notNull().default("BRL"), // BRL, USD, EUR
  allowsNegativeBalance: boolean("allows_negative_balance").notNull().default(false),
  creditLimit: text("credit_limit").default("0"), // Overdraft/credit limit
  color: text("color").notNull().default("#3B82F6"), // Visual identification
  status: text("status").notNull().default("active"), // "active" or "inactive"
  lastReconciliationDate: timestamp("last_reconciliation_date"), // Last time account was reconciled
  autoSyncEnabled: boolean("auto_sync_enabled").notNull().default(false), // Future: Open Banking integration
  lastSyncAt: timestamp("last_sync_at"), // Future: Last automatic sync
  syncFrequency: text("sync_frequency"), // Future: "daily", "weekly", "manual"
  notes: text("notes"), // Additional observations
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  index("bank_accounts_tenant_idx").on(table.tenantId, table.deleted, table.id),
  index("bank_accounts_tenant_company_idx").on(table.tenantId, table.companyId, table.deleted),
  index("bank_accounts_tenant_updated_idx").on(table.tenantId, table.updatedAt),
  index("bank_accounts_tenant_status_idx").on(table.tenantId, table.status, table.deleted),
]);

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  tenantId: true,
  currentBalance: true, // Managed internally
  updatedAt: true,
  version: true,
  deleted: true,
}).extend({
  initialBalance: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Saldo inicial deve ser um número válido" }
  ),
  creditLimit: z.string().optional().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    { message: "Limite deve ser um número válido" }
  ),
  holderDocument: z.string().min(11, "CPF/CNPJ inválido"),
  agencyNumber: z.string().min(1, "Agência é obrigatória"),
  accountNumber: z.string().min(1, "Conta é obrigatória"),
  initialBalanceDate: z.coerce.date(), // Accept strings and convert to Date
});

export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

// PIX Keys table - Multiple PIX keys per bank account
export const pixKeys = pgTable("pix_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  bankAccountId: varchar("bank_account_id").notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  keyType: text("key_type").notNull(), // "cpf", "cnpj", "email", "phone", "random", "evp"
  keyValue: text("key_value").notNull(),
  isDefault: boolean("is_default").notNull().default(false), // Main PIX key for this account
  status: text("status").notNull().default("active"), // "active" or "inactive"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  index("pix_keys_tenant_account_idx").on(table.tenantId, table.bankAccountId, table.deleted),
  index("pix_keys_tenant_updated_idx").on(table.tenantId, table.updatedAt),
  // Ensure unique PIX key value per tenant
  uniqueIndex("pix_keys_tenant_value_unique").on(table.tenantId, table.keyValue),
]);

export const insertPixKeySchema = createInsertSchema(pixKeys).omit({
  id: true,
  tenantId: true,
  bankAccountId: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  deleted: true,
}).extend({
  keyValue: z.string().min(1, "Chave PIX é obrigatória"),
  keyType: z.enum(["cpf", "cnpj", "email", "phone", "random", "evp"], {
    errorMap: () => ({ message: "Tipo de chave inválido" })
  }),
});

export type InsertPixKey = z.infer<typeof insertPixKeySchema>;
export type PixKey = typeof pixKeys.$inferSelect;

// Payment Methods table - Pre-defined payment methods that users can activate/deactivate
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: integer("code").notNull(), // Unique code within tenant
  name: text("name").notNull(), // "Dinheiro", "Pix", "Cartão de Crédito", etc
  description: text("description").notNull(), // Brief description
  icon: text("icon").notNull(), // Icon name from lucide-react
  isActive: boolean("is_active").notNull().default(false), // Whether this payment method is active for the tenant
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  index("payment_methods_tenant_idx").on(table.tenantId, table.id),
  uniqueIndex("payment_methods_tenant_code_unique").on(table.tenantId, table.code),
  index("payment_methods_tenant_updated_idx").on(table.tenantId, table.updatedAt),
  index("payment_methods_tenant_deleted_idx").on(table.tenantId, table.deleted, table.id),
  index("payment_methods_tenant_active_idx").on(table.tenantId, table.isActive, table.deleted),
]);

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  tenantId: true,
  code: true,
  updatedAt: true,
  version: true,
  deleted: true,
});

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

// Schema for toggling payment method active status
export const togglePaymentMethodSchema = z.object({
  isActive: z.boolean(),
}).strict(); // strict() ensures no extra fields

export type TogglePaymentMethod = z.infer<typeof togglePaymentMethodSchema>;

// Customers and Suppliers table - Unified entity that can be both customer AND supplier
export const customersSuppliers = pgTable("customers_suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: integer("code").notNull(), // Auto-generated: CLI001, CLI002, etc.
  
  // Type flags - Same entity can be both customer and supplier
  isCustomer: boolean("is_customer").notNull().default(false),
  isSupplier: boolean("is_supplier").notNull().default(false),
  
  // Identification
  name: text("name").notNull(), // Company name or person name
  documentType: text("document_type"), // "cpf", "cnpj", "foreign", "none"
  document: text("document"), // CPF, CNPJ, or foreign ID
  
  // Contact information
  phone: text("phone"),
  whatsapp: text("whatsapp"), // Can be same as phone or different
  email: text("email"),
  website: text("website"),
  
  // Address
  zipCode: text("zip_code"), // CEP
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("Brasil"),
  
  // Banking information (for future bank reconciliation)
  bankName: text("bank_name"),
  accountAgency: text("account_agency"),
  accountNumber: text("account_number"),
  pixKey: text("pix_key"),
  pixKeyType: text("pix_key_type"), // "cpf", "cnpj", "email", "phone", "random"
  
  // Additional data
  imageUrl: text("image_url"), // Circular avatar
  notes: text("notes"), // General observations
  
  // Status and control
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  // Primary tenant index for fast queries
  index("customers_suppliers_tenant_idx").on(table.tenantId, table.deleted, table.id),
  // Unique code per tenant
  uniqueIndex("customers_suppliers_tenant_code_unique").on(table.tenantId, table.code),
  // Index for filtering by type
  index("customers_suppliers_tenant_type_idx").on(table.tenantId, table.isCustomer, table.isSupplier, table.deleted),
  // Index for updates/sync
  index("customers_suppliers_tenant_updated_idx").on(table.tenantId, table.updatedAt),
  // Index for status filtering
  index("customers_suppliers_tenant_status_idx").on(table.tenantId, table.isActive, table.deleted),
  // Index for document lookups
  index("customers_suppliers_tenant_document_idx").on(table.tenantId, table.document, table.deleted),
]);

export const insertCustomerSupplierSchema = createInsertSchema(customersSuppliers).omit({
  id: true,
  tenantId: true,
  code: true, // Auto-generated
  updatedAt: true,
  version: true,
  deleted: true,
}).extend({
  // Custom validations
  isCustomer: z.boolean().refine(
    (val) => val !== undefined,
    { message: "Defina se é cliente" }
  ),
  isSupplier: z.boolean().refine(
    (val) => val !== undefined,
    { message: "Defina se é fornecedor" }
  ),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  document: z.string().optional(),
  documentType: z.enum(["cpf", "cnpj", "foreign", "none"]).optional(),
}).refine(
  (data) => data.isCustomer || data.isSupplier,
  {
    message: "O registro deve ser Cliente, Fornecedor ou ambos",
    path: ["isCustomer"],
  }
);

export type InsertCustomerSupplier = z.infer<typeof insertCustomerSupplierSchema>;
export type CustomerSupplier = typeof customersSuppliers.$inferSelect;

// Cash Registers table - Manages cash register points (caixas)
export const cashRegisters = pgTable("cash_registers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  code: integer("code").notNull(), // Auto-generated: CX001, CX002, etc.
  
  // Cash register info
  name: text("name").notNull(), // "Caixa Principal", "Loja Shopping", etc.
  defaultResponsibleId: varchar("default_responsible_id").references(() => users.id), // Optional default responsible
  
  // Financial control
  currentBalance: text("current_balance").notNull().default("0"), // Current balance (stored as string)
  openingBalance: text("opening_balance").default("0"), // Opening balance when cash register was opened
  isOpen: boolean("is_open").notNull().default(false), // Whether cash register is currently open
  lastOpenedAt: timestamp("last_opened_at"), // Last time cash register was opened
  lastClosedAt: timestamp("last_closed_at"), // Last time cash register was closed
  
  // Status and control
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  // Primary tenant + company index for fast queries
  index("cash_registers_tenant_company_idx").on(table.tenantId, table.companyId, table.deleted, table.id),
  // Unique code per tenant per company
  uniqueIndex("cash_registers_tenant_company_code_unique").on(table.tenantId, table.companyId, table.code),
  // Index for updates/sync
  index("cash_registers_tenant_company_updated_idx").on(table.tenantId, table.companyId, table.updatedAt),
  // Index for status filtering
  index("cash_registers_tenant_company_status_idx").on(table.tenantId, table.companyId, table.isActive, table.deleted),
]);

export const insertCashRegisterSchema = createInsertSchema(cashRegisters).omit({
  id: true,
  tenantId: true,
  code: true, // Auto-generated
  currentBalance: true, // Managed internally
  createdAt: true,
  updatedAt: true,
  version: true,
  deleted: true,
}).extend({
  companyId: z.string().min(1, "ID da empresa é obrigatório"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  defaultResponsibleId: z.string().optional(),
  openingBalance: z.string().optional(),
  isOpen: z.boolean().optional(),
  lastOpenedAt: z.date().optional(),
  lastClosedAt: z.date().optional(),
});

export type InsertCashRegister = z.infer<typeof insertCashRegisterSchema>;
export type CashRegister = typeof cashRegisters.$inferSelect;

// Bank Billing Configs table - Bank-specific configurations for boleto/billing generation
export const bankBillingConfigs = pgTable("bank_billing_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Bank identification
  bankCode: text("bank_code").notNull(), // "001" (BB), "104" (CEF), "237" (Bradesco), "341" (Itaú), "033" (Santander), "756" (Sicoob)
  bankName: text("bank_name").notNull(), // Full bank name
  
  // Bank account data
  agency: text("agency").notNull(), // Agência (com ou sem dígito)
  agencyDigit: text("agency_digit"), // Dígito da agência (alguns bancos)
  account: text("account").notNull(), // Conta
  accountDigit: text("account_digit").notNull(), // Dígito da conta
  
  // Boleto-specific fields
  covenant: text("covenant"), // Convênio / Código do Cedente (obrigatório BB, CEF)
  wallet: text("wallet"), // Carteira (ex: "18", "17", "09")
  walletVariation: text("wallet_variation"), // Variação da carteira (alguns bancos)
  ourNumberStart: text("our_number_start"), // Nosso Número inicial
  
  // Environment and status
  environment: text("environment").notNull().default("sandbox"), // "sandbox" or "production"
  isActive: boolean("is_active").notNull().default(false), // Configuration is active
  
  // Additional settings (JSON for bank-specific fields)
  additionalSettings: jsonb("additional_settings"), // Flexibility for bank-specific configs
  
  // Notes
  notes: text("notes"), // Internal notes about the configuration
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  index("bank_billing_configs_tenant_company_idx").on(table.tenantId, table.companyId, table.id),
  // Ensure only one active config per bank per company per tenant
  uniqueIndex("bank_billing_configs_tenant_company_bank_unique").on(table.tenantId, table.companyId, table.bankCode),
  index("bank_billing_configs_tenant_company_updated_idx").on(table.tenantId, table.companyId, table.updatedAt),
  index("bank_billing_configs_tenant_company_deleted_idx").on(table.tenantId, table.companyId, table.deleted, table.id),
  index("bank_billing_configs_tenant_company_active_idx").on(table.tenantId, table.companyId, table.isActive, table.deleted),
]);

export const insertBankBillingConfigSchema = createInsertSchema(bankBillingConfigs).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  deleted: true,
}).extend({
  companyId: z.string().min(1, "ID da empresa é obrigatório"),
  bankCode: z.string().min(1, "Código do banco é obrigatório"),
  bankName: z.string().min(1, "Nome do banco é obrigatório"),
  agency: z.string().min(1, "Agência é obrigatória"),
  account: z.string().min(1, "Conta é obrigatória"),
  accountDigit: z.string().min(1, "Dígito da conta é obrigatório"),
  environment: z.enum(["sandbox", "production"], {
    errorMap: () => ({ message: "Ambiente inválido" })
  }),
});

export type InsertBankBillingConfig = z.infer<typeof insertBankBillingConfigSchema>;
export type BankBillingConfig = typeof bankBillingConfigs.$inferSelect;

// Transactions table - Financial transactions (expenses and revenues)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Transaction type
  type: text("type").notNull(), // "expense" or "revenue"
  
  // Basic information
  title: text("title").notNull(), // Main title/description
  description: text("description"), // Additional details/notes
  
  // Related entities
  personId: varchar("person_id").references(() => customersSuppliers.id), // Customer or Supplier
  costCenterId: varchar("cost_center_id").references(() => costCenters.id),
  chartAccountId: varchar("chart_account_id").references(() => chartOfAccounts.id),
  
  // Dates
  issueDate: timestamp("issue_date").notNull(), // Issue/competence date
  dueDate: timestamp("due_date").notNull(), // Due date
  paidDate: timestamp("paid_date"), // When it was paid/received
  
  // Financial values (stored as text to avoid float precision issues)
  amount: text("amount").notNull(), // Total amount
  paidAmount: text("paid_amount"), // Amount actually paid (can differ from amount due to fees)
  discount: text("discount").default("0"), // Discount amount
  interest: text("interest").default("0"), // Interest/late fees
  fees: text("fees").default("0"), // Additional fees
  
  // Status
  status: text("status").notNull().default("pending"), // "pending", "paid", "overdue", "cancelled"
  
  // Payment information
  bankAccountId: varchar("bank_account_id").references(() => bankAccounts.id), // Which bank account was used
  paymentMethodId: varchar("payment_method_id").references(() => paymentMethods.id),
  cashRegisterId: varchar("cash_register_id").references(() => cashRegisters.id), // Which cash register processed it
  
  // Additional data
  tags: text("tags").array(), // Categorization tags
  attachmentsCount: integer("attachments_count").notNull().default(0), // Number of attached files
  
  // Recurrence control
  isRecurring: boolean("is_recurring").notNull().default(false),
  seriesId: varchar("series_id"), // Groups recurring transactions together
  recurrenceConfig: jsonb("recurrence_config"), // { frequency: "monthly", interval: 1, count: 12, endDate: "..." }
  installmentNumber: integer("installment_number"), // Which installment (1/10, 2/10, etc.)
  installmentTotal: integer("installment_total"), // Total installments in series
  
  // Reconciliation (for future bank reconciliation feature)
  isReconciled: boolean("is_reconciled").notNull().default(false),
  reconciledAt: timestamp("reconciled_at"),
  
  // Audit trail
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  // Primary tenant + company index
  index("transactions_tenant_company_idx").on(table.tenantId, table.companyId, table.deleted, table.id),
  // Index for date range queries (most common)
  index("transactions_tenant_company_date_idx").on(table.tenantId, table.companyId, table.dueDate, table.deleted),
  // Index for type filtering
  index("transactions_tenant_company_type_idx").on(table.tenantId, table.companyId, table.type, table.deleted),
  // Index for status filtering
  index("transactions_tenant_company_status_idx").on(table.tenantId, table.companyId, table.status, table.deleted),
  // Index for person filtering
  index("transactions_tenant_person_idx").on(table.tenantId, table.personId, table.deleted),
  // Index for cost center filtering
  index("transactions_tenant_cost_center_idx").on(table.tenantId, table.costCenterId, table.deleted),
  // Index for chart account filtering
  index("transactions_tenant_chart_account_idx").on(table.tenantId, table.chartAccountId, table.deleted),
  // Index for series (recurring transactions)
  index("transactions_tenant_series_idx").on(table.tenantId, table.seriesId, table.deleted),
  // Index for updates/sync
  index("transactions_tenant_company_updated_idx").on(table.tenantId, table.companyId, table.updatedAt),
  // Index for cash register
  index("transactions_tenant_cash_register_idx").on(table.tenantId, table.cashRegisterId, table.deleted),
]);

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  deleted: true,
  createdBy: true,
  updatedBy: true,
}).extend({
  companyId: z.string().min(1, "ID da empresa é obrigatório"),
  type: z.enum(["expense", "revenue"], {
    errorMap: () => ({ message: "Tipo deve ser despesa ou receita" })
  }),
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  personId: z.string().optional(),
  costCenterId: z.string().optional(),
  chartAccountId: z.string().optional(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  paidDate: z.coerce.date().optional().nullable(),
  amount: z.string().min(1, "Valor é obrigatório"),
  paidAmount: z.string().optional(),
  discount: z.string().optional(),
  interest: z.string().optional(),
  fees: z.string().optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
  bankAccountId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  cashRegisterId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachmentsCount: z.number().optional(),
  isRecurring: z.boolean().optional(),
  seriesId: z.string().optional(),
  recurrenceConfig: z.any().optional(), // JSONB - flexible structure
  installmentNumber: z.number().optional(),
  installmentTotal: z.number().optional(),
  isReconciled: z.boolean().optional(),
  reconciledAt: z.coerce.date().optional().nullable(),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Discovered Companies - Cache for CNPJ discoveries via Google Custom Search API
// Stores companies found through web search to avoid repeated API calls
export const discoveredCompanies = pgTable("discovered_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Search key (normalized company name for fast lookup)
  nameNormalized: text("name_normalized").notNull().unique(), // Normalized name used for matching
  
  // CNPJ information
  cnpj: text("cnpj").notNull(), // Validated CNPJ
  legalName: text("legal_name").notNull(), // Official legal name from Receita Federal
  
  // Source tracking
  source: text("source").notNull(), // "google_search", "static_db", "manual"
  confidence: text("confidence").notNull().default("0.8"), // Confidence score (0-1)
  
  // Additional metadata
  searchQuery: text("search_query"), // Original search query that found this company
  googleSnippet: text("google_snippet"), // Snippet from Google search result
  
  // Audit trail
  discoveredAt: timestamp("discovered_at").notNull().defaultNow(),
  timesUsed: integer("times_used").notNull().default(1), // How many times this cache entry was used
  lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
}, (table) => [
  // Fast lookup by normalized name
  index("discovered_companies_name_idx").on(table.nameNormalized),
  // Lookup by CNPJ
  index("discovered_companies_cnpj_idx").on(table.cnpj),
  // Track usage patterns
  index("discovered_companies_usage_idx").on(table.timesUsed, table.lastUsedAt),
]);

export const insertDiscoveredCompanySchema = createInsertSchema(discoveredCompanies).omit({
  id: true,
  discoveredAt: true,
  timesUsed: true,
  lastUsedAt: true,
});

export type InsertDiscoveredCompany = z.infer<typeof insertDiscoveredCompanySchema>;
export type DiscoveredCompany = typeof discoveredCompanies.$inferSelect;
