import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
