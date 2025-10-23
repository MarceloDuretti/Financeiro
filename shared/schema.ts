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

// Categories table - For categorizing transactions (receivables/payables)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: integer("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "receita" or "despesa"
  color: text("color").notNull().default("#3B82F6"), // Hex color for visual badges
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  deleted: boolean("deleted").notNull().default(false),
}, (table) => [
  index("categories_tenant_idx").on(table.tenantId, table.deleted, table.id),
  uniqueIndex("categories_tenant_code_type_unique").on(table.tenantId, table.code, table.type),
  index("categories_tenant_updated_idx").on(table.tenantId, table.updatedAt),
  index("categories_tenant_type_idx").on(table.tenantId, table.type, table.deleted),
]);

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  tenantId: true,
  updatedAt: true,
  version: true,
  deleted: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
