// Integration: blueprint:javascript_database
import {
  users,
  companies,
  userCompanies,
  type User,
  type InsertUser,
  type Company,
  type InsertCompany,
  type UserCompany,
  type InsertUserCompany,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - for local authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByInviteToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  listCollaborators(adminId: string): Promise<User[]>;

  // Company operations
  listCompanies(): Promise<Company[]>;
  getCompanyById(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(
    id: string,
    company: Partial<InsertCompany>
  ): Promise<Company | undefined>;

  // User-Company relationship operations
  createUserCompany(userCompany: InsertUserCompany): Promise<UserCompany>;
  deleteUserCompanies(userId: string): Promise<void>;
  getUserCompanies(userId: string): Promise<Company[]>;
  getCompanyUsers(companyId: string): Promise<User[]>;
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

  async getUserByInviteToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.inviteToken, token));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async listCollaborators(adminId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.adminId, adminId));
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

  // User-Company relationship operations

  async createUserCompany(userCompanyData: InsertUserCompany): Promise<UserCompany> {
    const [userCompany] = await db
      .insert(userCompanies)
      .values(userCompanyData)
      .returning();
    return userCompany;
  }

  async deleteUserCompanies(userId: string): Promise<void> {
    await db.delete(userCompanies).where(eq(userCompanies.userId, userId));
  }

  async getUserCompanies(userId: string): Promise<Company[]> {
    const userCompaniesList = await db
      .select()
      .from(userCompanies)
      .where(eq(userCompanies.userId, userId));
    
    if (userCompaniesList.length === 0) {
      return [];
    }

    const companyIds = userCompaniesList.map((uc) => uc.companyId);
    return await db
      .select()
      .from(companies)
      .where(inArray(companies.id, companyIds));
  }

  async getCompanyUsers(companyId: string): Promise<User[]> {
    const userCompaniesList = await db
      .select()
      .from(userCompanies)
      .where(eq(userCompanies.companyId, companyId));
    
    if (userCompaniesList.length === 0) {
      return [];
    }

    const userIds = userCompaniesList.map((uc) => uc.userId);
    return await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));
  }
}

export const storage = new DatabaseStorage();
