// Integration: blueprint:javascript_database
import {
  users,
  companies,
  type User,
  type InsertUser,
  type Company,
  type InsertCompany,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - for local authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company operations
  listCompanies(): Promise<Company[]>;
  getCompanyById(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(
    id: string,
    company: Partial<InsertCompany>
  ): Promise<Company | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations - for local authentication

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Company operations

  async listCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    return company;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(
    id: string,
    updates: Partial<InsertCompany>
  ): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }
}

export const storage = new DatabaseStorage();
