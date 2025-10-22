import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
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

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Companies table for multi-company management
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull(),
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
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
