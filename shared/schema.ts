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
  bankName: text("bank_name").notNull(), // "Banco Itaú"
  bankCode: text("bank_code"), // COMPE/ISPB code for integrations (e.g., "341" for Itaú)
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
