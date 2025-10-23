// Integration: blueprint:javascript_database
import {
  users,
  companies,
  userCompanies,
  companyMembers,
  type User,
  type InsertUser,
  type Company,
  type InsertCompany,
  type UserCompany,
  type InsertUserCompany,
  type CompanyMember,
  type InsertCompanyMember,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - for local authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByInviteToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  listCollaborators(adminId: string): Promise<User[]>;

  // Company operations - all require tenantId for multi-tenant isolation
  listCompanies(tenantId: string): Promise<Company[]>;
  getCompanyById(tenantId: string, id: string): Promise<Company | undefined>;
  createCompany(tenantId: string, company: Omit<InsertCompany, 'tenantId'>): Promise<Company>;
  updateCompany(
    tenantId: string,
    id: string,
    company: Partial<Omit<InsertCompany, 'tenantId'>>
  ): Promise<Company | undefined>;
  deleteCompany(tenantId: string, id: string): Promise<boolean>;

  // User-Company relationship operations - all require tenantId for multi-tenant isolation
  createUserCompany(tenantId: string, userCompany: Omit<InsertUserCompany, 'tenantId'>): Promise<UserCompany>;
  deleteUserCompanies(tenantId: string, userId: string): Promise<void>;
  getUserCompanies(tenantId: string, userId: string): Promise<Company[]>;
  getCompanyUsers(tenantId: string, companyId: string): Promise<User[]>;

  // Company Members operations - all require tenantId for multi-tenant isolation
  listCompanyMembers(tenantId: string, companyId: string): Promise<CompanyMember[]>;
  getCompanyMember(tenantId: string, id: string): Promise<CompanyMember | undefined>;
  createCompanyMember(tenantId: string, companyId: string, member: InsertCompanyMember): Promise<CompanyMember>;
  updateCompanyMember(
    tenantId: string,
    id: string,
    member: Partial<InsertCompanyMember>
  ): Promise<CompanyMember | undefined>;
  deleteCompanyMember(tenantId: string, id: string): Promise<boolean>;
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

  // Company operations - with tenant isolation

  async listCompanies(tenantId: string): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(and(eq(companies.tenantId, tenantId), eq(companies.deleted, false)));
  }

  async getCompanyById(tenantId: string, id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenantId, tenantId),
        eq(companies.id, id),
        eq(companies.deleted, false)
      ));
    return company;
  }

  async createCompany(tenantId: string, insertCompany: Omit<InsertCompany, 'tenantId'>): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values({ ...insertCompany, tenantId })
      .returning();
    return company;
  }

  async updateCompany(
    tenantId: string,
    id: string,
    updates: Partial<Omit<InsertCompany, 'tenantId'>>
  ): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({
        ...updates,
        updatedAt: new Date(),
        version: sql`${companies.version} + 1`, // Atomic increment
      })
      .where(and(eq(companies.tenantId, tenantId), eq(companies.id, id)))
      .returning();
    return company;
  }

  async deleteCompany(tenantId: string, id: string): Promise<boolean> {
    // Soft-delete: mark as deleted instead of physically removing
    const result = await db
      .update(companies)
      .set({ 
        deleted: true,
        updatedAt: new Date(),
        version: sql`${companies.version} + 1`, // Atomic increment
      })
      .where(and(
        eq(companies.tenantId, tenantId),
        eq(companies.id, id),
        eq(companies.deleted, false) // Only delete if not already deleted
      ))
      .returning();
    return result.length > 0;
  }

  // User-Company relationship operations - with tenant isolation

  async createUserCompany(tenantId: string, userCompanyData: Omit<InsertUserCompany, 'tenantId'>): Promise<UserCompany> {
    const [userCompany] = await db
      .insert(userCompanies)
      .values({ ...userCompanyData, tenantId })
      .returning();
    return userCompany;
  }

  async deleteUserCompanies(tenantId: string, userId: string): Promise<void> {
    await db.delete(userCompanies).where(
      and(eq(userCompanies.tenantId, tenantId), eq(userCompanies.userId, userId))
    );
  }

  async getUserCompanies(tenantId: string, userId: string): Promise<Company[]> {
    const userCompaniesList = await db
      .select()
      .from(userCompanies)
      .where(and(
        eq(userCompanies.tenantId, tenantId),
        eq(userCompanies.userId, userId),
        eq(userCompanies.deleted, false)
      ));
    
    if (userCompaniesList.length === 0) {
      return [];
    }

    const companyIds = userCompaniesList.map((uc) => uc.companyId);
    return await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenantId, tenantId),
        inArray(companies.id, companyIds),
        eq(companies.deleted, false)
      ));
  }

  async getCompanyUsers(tenantId: string, companyId: string): Promise<User[]> {
    const userCompaniesList = await db
      .select()
      .from(userCompanies)
      .where(and(
        eq(userCompanies.tenantId, tenantId),
        eq(userCompanies.companyId, companyId),
        eq(userCompanies.deleted, false)
      ));
    
    if (userCompaniesList.length === 0) {
      return [];
    }

    const userIds = userCompaniesList.map((uc) => uc.userId);
    return await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));
  }

  // Company Members operations - with tenant isolation

  async listCompanyMembers(tenantId: string, companyId: string): Promise<CompanyMember[]> {
    return await db
      .select()
      .from(companyMembers)
      .where(and(
        eq(companyMembers.tenantId, tenantId),
        eq(companyMembers.companyId, companyId),
        eq(companyMembers.deleted, false)
      ));
  }

  async getCompanyMember(tenantId: string, id: string): Promise<CompanyMember | undefined> {
    const [member] = await db
      .select()
      .from(companyMembers)
      .where(and(
        eq(companyMembers.tenantId, tenantId),
        eq(companyMembers.id, id),
        eq(companyMembers.deleted, false)
      ));
    return member;
  }

  async createCompanyMember(tenantId: string, companyId: string, memberData: InsertCompanyMember): Promise<CompanyMember> {
    const [member] = await db
      .insert(companyMembers)
      .values({ ...memberData, tenantId, companyId })
      .returning();
    return member;
  }

  async updateCompanyMember(
    tenantId: string,
    id: string,
    updates: Partial<Omit<InsertCompanyMember, 'tenantId' | 'companyId'>>
  ): Promise<CompanyMember | undefined> {
    const [member] = await db
      .update(companyMembers)
      .set({
        ...updates,
        updatedAt: new Date(),
        version: sql`${companyMembers.version} + 1`, // Atomic increment
      })
      .where(and(
        eq(companyMembers.tenantId, tenantId),
        eq(companyMembers.id, id),
        eq(companyMembers.deleted, false)
      ))
      .returning();
    return member;
  }

  async deleteCompanyMember(tenantId: string, id: string): Promise<boolean> {
    // Soft-delete: mark as deleted instead of physically removing
    const result = await db
      .update(companyMembers)
      .set({
        deleted: true,
        updatedAt: new Date(),
        version: sql`${companyMembers.version} + 1`, // Atomic increment
      })
      .where(and(
        eq(companyMembers.tenantId, tenantId),
        eq(companyMembers.id, id),
        eq(companyMembers.deleted, false) // Only delete if not already deleted
      ))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
