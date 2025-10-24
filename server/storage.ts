// Integration: blueprint:javascript_database
import {
  users,
  companies,
  userCompanies,
  companyMembers,
  costCenters,
  chartOfAccounts,
  bankAccounts,
  pixKeys,
  type User,
  type InsertUser,
  type Company,
  type InsertCompany,
  type UserCompany,
  type InsertUserCompany,
  type CompanyMember,
  type InsertCompanyMember,
  type CostCenter,
  type InsertCostCenter,
  type ChartAccount,
  type InsertChartAccount,
  type BankAccount,
  type InsertBankAccount,
  type PixKey,
  type InsertPixKey,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, sql, max } from "drizzle-orm";

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
  createCompany(tenantId: string, company: Omit<InsertCompany, 'tenantId' | 'code'>): Promise<Company>;
  updateCompany(
    tenantId: string,
    id: string,
    company: Partial<Omit<InsertCompany, 'tenantId' | 'code'>>
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

  // Cost Centers operations - all require tenantId for multi-tenant isolation
  listCostCenters(tenantId: string): Promise<CostCenter[]>;
  getCostCenterById(tenantId: string, id: string): Promise<CostCenter | undefined>;
  createCostCenter(tenantId: string, costCenter: Omit<InsertCostCenter, 'code'>): Promise<CostCenter>;
  updateCostCenter(
    tenantId: string,
    id: string,
    costCenter: Partial<Omit<InsertCostCenter, 'code'>>
  ): Promise<CostCenter | undefined>;
  deleteCostCenter(tenantId: string, id: string): Promise<boolean>;

  // Chart of Accounts operations - all require tenantId for multi-tenant isolation
  listChartOfAccounts(tenantId: string): Promise<ChartAccount[]>;
  getChartAccount(tenantId: string, id: string): Promise<ChartAccount | undefined>;
  createChartAccount(
    tenantId: string,
    account: Omit<InsertChartAccount, 'code'>
  ): Promise<ChartAccount>;
  updateChartAccount(
    tenantId: string,
    id: string,
    account: Partial<Omit<InsertChartAccount, 'code' | 'parentId'>>
  ): Promise<ChartAccount | undefined>;
  deleteChartAccount(tenantId: string, id: string): Promise<boolean>;
  seedDefaultChartAccounts(tenantId: string): Promise<void>;

  // Bank Accounts operations - all require tenantId for multi-tenant isolation
  listBankAccounts(tenantId: string): Promise<BankAccount[]>;
  getBankAccount(tenantId: string, id: string): Promise<BankAccount | undefined>;
  createBankAccount(tenantId: string, account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(
    tenantId: string,
    id: string,
    account: Partial<InsertBankAccount>
  ): Promise<BankAccount | undefined>;
  deleteBankAccount(tenantId: string, id: string): Promise<boolean>;

  // PIX Keys operations - all require tenantId for multi-tenant isolation
  listPixKeysByAccount(tenantId: string, bankAccountId: string): Promise<PixKey[]>;
  getPixKey(tenantId: string, id: string): Promise<PixKey | undefined>;
  createPixKey(tenantId: string, bankAccountId: string, pixKey: InsertPixKey): Promise<PixKey>;
  updatePixKey(
    tenantId: string,
    id: string,
    pixKey: Partial<InsertPixKey>
  ): Promise<PixKey | undefined>;
  deletePixKey(tenantId: string, id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Helper: Generate numeric hash from string for advisory lock
  private hashStringToInt(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

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

  private async getNextCompanyCode(tenantId: string): Promise<number> {
    // Use advisory lock to prevent race conditions
    return await db.transaction(async (tx) => {
      const lockKey = this.hashStringToInt(`company_${tenantId}`);
      
      // Acquire transactional advisory lock (auto-released on commit)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);
      
      // Now safely read max code
      const result = await tx
        .select({ maxCode: max(companies.code) })
        .from(companies)
        .where(eq(companies.tenantId, tenantId));
      
      const currentMax = result[0]?.maxCode || 0;
      return currentMax + 1;
    });
  }

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

  async createCompany(tenantId: string, insertCompany: Omit<InsertCompany, 'tenantId' | 'code'>): Promise<Company> {
    // Execute lock + code generation + insert in single transaction
    return await db.transaction(async (tx) => {
      const lockKey = this.hashStringToInt(`company_${tenantId}`);
      
      // Acquire advisory lock
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);
      
      // Get next code
      const result = await tx
        .select({ maxCode: max(companies.code) })
        .from(companies)
        .where(eq(companies.tenantId, tenantId));
      
      const code = (result[0]?.maxCode || 0) + 1;
      
      // Insert with generated code (lock still held)
      const [company] = await tx
        .insert(companies)
        .values({ ...insertCompany, code, tenantId })
        .returning();
      
      return company;
      // Lock auto-released on commit
    });
  }

  async updateCompany(
    tenantId: string,
    id: string,
    updates: Partial<Omit<InsertCompany, 'tenantId' | 'code'>>
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

  // Cost Centers operations - with tenant isolation

  private async getNextCostCenterCode(tenantId: string): Promise<number> {
    // Use advisory lock to prevent race conditions
    return await db.transaction(async (tx) => {
      const lockKey = this.hashStringToInt(`cost_center_${tenantId}`);
      
      // Acquire transactional advisory lock (auto-released on commit)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);
      
      // Now safely read max code for this tenant
      const result = await tx
        .select({ maxCode: max(costCenters.code) })
        .from(costCenters)
        .where(eq(costCenters.tenantId, tenantId));
      
      const currentMax = result[0]?.maxCode || 0;
      return currentMax + 1;
    });
  }

  async listCostCenters(tenantId: string): Promise<CostCenter[]> {
    return await db
      .select()
      .from(costCenters)
      .where(and(
        eq(costCenters.tenantId, tenantId),
        eq(costCenters.deleted, false)
      ));
  }

  async getCostCenterById(tenantId: string, id: string): Promise<CostCenter | undefined> {
    const [costCenter] = await db
      .select()
      .from(costCenters)
      .where(and(
        eq(costCenters.tenantId, tenantId),
        eq(costCenters.id, id),
        eq(costCenters.deleted, false)
      ));
    return costCenter;
  }

  async createCostCenter(tenantId: string, costCenterData: Omit<InsertCostCenter, 'code'>): Promise<CostCenter> {
    // Execute lock + code generation + insert in single transaction
    return await db.transaction(async (tx) => {
      const lockKey = this.hashStringToInt(`cost_center_${tenantId}`);
      
      // Acquire advisory lock
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);
      
      // Get next code for this tenant
      const result = await tx
        .select({ maxCode: max(costCenters.code) })
        .from(costCenters)
        .where(eq(costCenters.tenantId, tenantId));
      
      const code = (result[0]?.maxCode || 0) + 1;
      
      // Insert with generated code (lock still held)
      const [costCenter] = await tx
        .insert(costCenters)
        .values({ ...costCenterData, code, tenantId })
        .returning();
      
      return costCenter;
      // Lock auto-released on commit
    });
  }

  async updateCostCenter(
    tenantId: string,
    id: string,
    updates: Partial<Omit<InsertCostCenter, 'code'>>
  ): Promise<CostCenter | undefined> {
    const [costCenter] = await db
      .update(costCenters)
      .set({
        ...updates,
        updatedAt: new Date(),
        version: sql`${costCenters.version} + 1`, // Atomic increment
      })
      .where(and(
        eq(costCenters.tenantId, tenantId),
        eq(costCenters.id, id),
        eq(costCenters.deleted, false)
      ))
      .returning();
    return costCenter;
  }

  async deleteCostCenter(tenantId: string, id: string): Promise<boolean> {
    // Soft-delete: mark as deleted instead of physically removing
    const result = await db
      .update(costCenters)
      .set({
        deleted: true,
        updatedAt: new Date(),
        version: sql`${costCenters.version} + 1`, // Atomic increment
      })
      .where(and(
        eq(costCenters.tenantId, tenantId),
        eq(costCenters.id, id),
        eq(costCenters.deleted, false) // Only delete if not already deleted
      ))
      .returning();
    return result.length > 0;
  }

  // Chart of Accounts operations

  async listChartOfAccounts(tenantId: string): Promise<ChartAccount[]> {
    const accounts = await db
      .select()
      .from(chartOfAccounts)
      .where(and(
        eq(chartOfAccounts.tenantId, tenantId),
        eq(chartOfAccounts.deleted, false)
      ))
      .orderBy(chartOfAccounts.path);
    return accounts;
  }

  async getChartAccount(tenantId: string, id: string): Promise<ChartAccount | undefined> {
    const [account] = await db
      .select()
      .from(chartOfAccounts)
      .where(and(
        eq(chartOfAccounts.tenantId, tenantId),
        eq(chartOfAccounts.id, id),
        eq(chartOfAccounts.deleted, false)
      ));
    return account;
  }

  async createChartAccount(
    tenantId: string,
    accountData: Omit<InsertChartAccount, 'code'>
  ): Promise<ChartAccount> {
    // Execute lock + code generation + insert in single transaction
    return await db.transaction(async (tx) => {
      const parentKey = accountData.parentId || 'root';
      const lockKey = this.hashStringToInt(`chart_account_${tenantId}_${parentKey}`);
      
      // Acquire advisory lock
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);
      
      let code: string;
      let depth: number;
      let fullPathName: string;
      
      if (!accountData.parentId) {
        // Root account: get next root-level number
        const result = await tx
          .select({ maxPath: sql<string>`MAX(${chartOfAccounts.path})` })
          .from(chartOfAccounts)
          .where(and(
            eq(chartOfAccounts.tenantId, tenantId),
            eq(chartOfAccounts.depth, 0)
          ));
        
        const maxPath = result[0]?.maxPath;
        const nextNum = maxPath ? parseInt(maxPath) + 1 : 1;
        code = nextNum.toString();
        depth = 0;
        fullPathName = accountData.name;
      } else {
        // Sub-account: get parent info
        const [parent] = await tx
          .select()
          .from(chartOfAccounts)
          .where(and(
            eq(chartOfAccounts.tenantId, tenantId),
            eq(chartOfAccounts.id, accountData.parentId),
            eq(chartOfAccounts.deleted, false)
          ));
        
        if (!parent) {
          throw new Error('Parent account not found');
        }
        
        // Get next child number under this parent
        const result = await tx
          .select({ maxPath: sql<string>`MAX(${chartOfAccounts.path})` })
          .from(chartOfAccounts)
          .where(and(
            eq(chartOfAccounts.tenantId, tenantId),
            eq(chartOfAccounts.parentId, accountData.parentId)
          ));
        
        const siblings = result[0]?.maxPath;
        let nextChildNum = 1;
        
        if (siblings) {
          // Extract last segment: "1.2.3" -> "3"
          const parts = siblings.split('.');
          nextChildNum = parseInt(parts[parts.length - 1]) + 1;
        }
        
        code = `${parent.path}.${nextChildNum}`;
        depth = parent.depth + 1;
        fullPathName = `${parent.fullPathName} > ${accountData.name}`;
      }
      
      // Insert with computed fields (lock still held)
      const [account] = await tx
        .insert(chartOfAccounts)
        .values({
          ...accountData,
          tenantId,
          code,
          path: code, // Path = code for this implementation
          depth,
          fullPathName,
        })
        .returning();
      
      return account;
      // Lock auto-released on commit
    });
  }

  async updateChartAccount(
    tenantId: string,
    id: string,
    updates: Partial<Omit<InsertChartAccount, 'code' | 'parentId'>>
  ): Promise<ChartAccount | undefined> {
    // For now, we only allow updating name, description, type
    // Moving accounts (changing parentId) requires recalculating all descendants
    // That will be implemented in a future iteration if needed
    
    return await db.transaction(async (tx) => {
      // Get current account
      const [current] = await tx
        .select()
        .from(chartOfAccounts)
        .where(and(
          eq(chartOfAccounts.tenantId, tenantId),
          eq(chartOfAccounts.id, id),
          eq(chartOfAccounts.deleted, false)
        ));
      
      if (!current) {
        return undefined;
      }
      
      let newFullPathName = current.fullPathName;
      
      // If name is being updated, recompute fullPathName
      if (updates.name && updates.name !== current.name) {
        if (!current.parentId) {
          // Root account
          newFullPathName = updates.name;
        } else {
          // Sub-account: get parent's fullPathName
          const [parent] = await tx
            .select()
            .from(chartOfAccounts)
            .where(and(
              eq(chartOfAccounts.tenantId, tenantId),
              eq(chartOfAccounts.id, current.parentId),
              eq(chartOfAccounts.deleted, false)
            ));
          
          if (parent) {
            newFullPathName = `${parent.fullPathName} > ${updates.name}`;
          }
        }
      }
      
      const [account] = await tx
        .update(chartOfAccounts)
        .set({
          ...updates,
          fullPathName: newFullPathName,
          updatedAt: new Date(),
          version: sql`${chartOfAccounts.version} + 1`,
        })
        .where(and(
          eq(chartOfAccounts.tenantId, tenantId),
          eq(chartOfAccounts.id, id),
          eq(chartOfAccounts.deleted, false)
        ))
        .returning();
      
      return account;
    });
  }

  async deleteChartAccount(tenantId: string, id: string): Promise<boolean> {
    // Check if account has children
    const children = await db
      .select()
      .from(chartOfAccounts)
      .where(and(
        eq(chartOfAccounts.tenantId, tenantId),
        eq(chartOfAccounts.parentId, id),
        eq(chartOfAccounts.deleted, false)
      ));
    
    if (children.length > 0) {
      throw new Error('Cannot delete account with children. Delete children first.');
    }
    
    // Soft-delete: mark as deleted instead of physically removing
    const result = await db
      .update(chartOfAccounts)
      .set({
        deleted: true,
        updatedAt: new Date(),
        version: sql`${chartOfAccounts.version} + 1`,
      })
      .where(and(
        eq(chartOfAccounts.tenantId, tenantId),
        eq(chartOfAccounts.id, id),
        eq(chartOfAccounts.deleted, false)
      ))
      .returning();
    return result.length > 0;
  }

  // Seed default chart of accounts structure (5 root accounts)
  async seedDefaultChartAccounts(tenantId: string): Promise<void> {
    const defaultAccounts = [
      { name: 'Receitas', type: 'receita', description: 'Todas as receitas da empresa' },
      { name: 'Despesas', type: 'despesa', description: 'Todas as despesas da empresa' },
      { name: 'Ativo', type: 'ativo', description: 'Bens e direitos da empresa' },
      { name: 'Passivo', type: 'passivo', description: 'Obrigações da empresa' },
      { name: 'Patrimônio Líquido', type: 'patrimonio_liquido', description: 'Capital e reservas da empresa' },
    ];

    for (const account of defaultAccounts) {
      await this.createChartAccount(tenantId, {
        name: account.name,
        type: account.type,
        description: account.description,
        parentId: null, // Root accounts
      });
    }
  }

  // Bank Accounts operations - with tenant isolation

  async listBankAccounts(tenantId: string): Promise<BankAccount[]> {
    return await db
      .select()
      .from(bankAccounts)
      .where(and(
        eq(bankAccounts.tenantId, tenantId),
        eq(bankAccounts.deleted, false)
      ))
      .orderBy(bankAccounts.description);
  }

  async getBankAccount(tenantId: string, id: string): Promise<BankAccount | undefined> {
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(and(
        eq(bankAccounts.tenantId, tenantId),
        eq(bankAccounts.id, id),
        eq(bankAccounts.deleted, false)
      ));
    return account;
  }

  async createBankAccount(tenantId: string, accountData: InsertBankAccount): Promise<BankAccount> {
    // Set currentBalance to initialBalance on creation
    const [account] = await db
      .insert(bankAccounts)
      .values({
        ...accountData,
        tenantId,
        currentBalance: accountData.initialBalance,
      })
      .returning();
    return account;
  }

  async updateBankAccount(
    tenantId: string,
    id: string,
    updates: Partial<InsertBankAccount>
  ): Promise<BankAccount | undefined> {
    const [account] = await db
      .update(bankAccounts)
      .set({
        ...updates,
        updatedAt: new Date(),
        version: sql`${bankAccounts.version} + 1`,
      })
      .where(and(
        eq(bankAccounts.tenantId, tenantId),
        eq(bankAccounts.id, id),
        eq(bankAccounts.deleted, false)
      ))
      .returning();
    return account;
  }

  async deleteBankAccount(tenantId: string, id: string): Promise<boolean> {
    // Soft-delete: mark as deleted instead of physically removing
    const result = await db
      .update(bankAccounts)
      .set({
        deleted: true,
        updatedAt: new Date(),
        version: sql`${bankAccounts.version} + 1`,
      })
      .where(and(
        eq(bankAccounts.tenantId, tenantId),
        eq(bankAccounts.id, id),
        eq(bankAccounts.deleted, false)
      ))
      .returning();
    return result.length > 0;
  }

  // PIX Keys operations - with tenant isolation

  async listPixKeysByAccount(tenantId: string, bankAccountId: string): Promise<PixKey[]> {
    return await db
      .select()
      .from(pixKeys)
      .where(and(
        eq(pixKeys.tenantId, tenantId),
        eq(pixKeys.bankAccountId, bankAccountId),
        eq(pixKeys.deleted, false)
      ))
      .orderBy(pixKeys.isDefault, pixKeys.createdAt);
  }

  async getPixKey(tenantId: string, id: string): Promise<PixKey | undefined> {
    const [pixKey] = await db
      .select()
      .from(pixKeys)
      .where(and(
        eq(pixKeys.tenantId, tenantId),
        eq(pixKeys.id, id),
        eq(pixKeys.deleted, false)
      ));
    return pixKey;
  }

  async createPixKey(
    tenantId: string,
    bankAccountId: string,
    pixKeyData: InsertPixKey
  ): Promise<PixKey> {
    // If this is set as default, unset all other defaults for this account
    return await db.transaction(async (tx) => {
      if (pixKeyData.isDefault) {
        await tx
          .update(pixKeys)
          .set({ isDefault: false })
          .where(and(
            eq(pixKeys.tenantId, tenantId),
            eq(pixKeys.bankAccountId, bankAccountId),
            eq(pixKeys.deleted, false)
          ));
      }

      const [pixKey] = await tx
        .insert(pixKeys)
        .values({
          ...pixKeyData,
          tenantId,
          bankAccountId,
        })
        .returning();
      
      return pixKey;
    });
  }

  async updatePixKey(
    tenantId: string,
    id: string,
    updates: Partial<InsertPixKey>
  ): Promise<PixKey | undefined> {
    return await db.transaction(async (tx) => {
      // If setting as default, first unset all other defaults for this account
      if (updates.isDefault) {
        // Get the bank account ID first
        const [currentKey] = await tx
          .select()
          .from(pixKeys)
          .where(and(
            eq(pixKeys.tenantId, tenantId),
            eq(pixKeys.id, id),
            eq(pixKeys.deleted, false)
          ));
        
        if (currentKey) {
          await tx
            .update(pixKeys)
            .set({ isDefault: false })
            .where(and(
              eq(pixKeys.tenantId, tenantId),
              eq(pixKeys.bankAccountId, currentKey.bankAccountId),
              eq(pixKeys.deleted, false)
            ));
        }
      }

      const [pixKey] = await tx
        .update(pixKeys)
        .set({
          ...updates,
          updatedAt: new Date(),
          version: sql`${pixKeys.version} + 1`,
        })
        .where(and(
          eq(pixKeys.tenantId, tenantId),
          eq(pixKeys.id, id),
          eq(pixKeys.deleted, false)
        ))
        .returning();
      
      return pixKey;
    });
  }

  async deletePixKey(tenantId: string, id: string): Promise<boolean> {
    // Soft-delete: mark as deleted instead of physically removing
    const result = await db
      .update(pixKeys)
      .set({
        deleted: true,
        updatedAt: new Date(),
        version: sql`${pixKeys.version} + 1`,
      })
      .where(and(
        eq(pixKeys.tenantId, tenantId),
        eq(pixKeys.id, id),
        eq(pixKeys.deleted, false)
      ))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
