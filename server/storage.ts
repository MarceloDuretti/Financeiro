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
  paymentMethods,
  customersSuppliers,
  cashRegisters,
  bankBillingConfigs,
  transactions,
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
  type PaymentMethod,
  type InsertPaymentMethod,
  type CustomerSupplier,
  type InsertCustomerSupplier,
  type CashRegister,
  type InsertCashRegister,
  type BankBillingConfig,
  type InsertBankBillingConfig,
  type Transaction,
  type InsertTransaction,
  discoveredCompanies,
  type DiscoveredCompany,
  type InsertDiscoveredCompany,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, sql, max, gte, lte, like, or, desc, gt } from "drizzle-orm";
import { format } from "date-fns";

// Interface for storage operations
export interface IStorage {
  // User operations - for local authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByInviteToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: { id?: string; email: string; firstName?: string | null; lastName?: string | null; profileImageUrl?: string | null; role?: string; status?: string }): Promise<User>;
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
  clearChildrenChartAccounts(tenantId: string): Promise<string[]>;
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

  // Payment Methods operations - all require tenantId for multi-tenant isolation
  listPaymentMethods(tenantId: string): Promise<PaymentMethod[]>;
  togglePaymentMethod(tenantId: string, id: string, isActive: boolean): Promise<PaymentMethod | undefined>;
  seedDefaultPaymentMethods(tenantId: string): Promise<void>;

  // Customers/Suppliers operations - all require tenantId for multi-tenant isolation
  listCustomersSuppliers(tenantId: string): Promise<CustomerSupplier[]>;
  getCustomerSupplier(tenantId: string, id: string): Promise<CustomerSupplier | undefined>;
  createCustomerSupplier(tenantId: string, entity: InsertCustomerSupplier): Promise<CustomerSupplier>;
  updateCustomerSupplier(
    tenantId: string,
    id: string,
    entity: Partial<InsertCustomerSupplier>
  ): Promise<CustomerSupplier | undefined>;
  deleteCustomerSupplier(tenantId: string, id: string): Promise<boolean>;
  toggleCustomerSupplierActive(tenantId: string, id: string): Promise<CustomerSupplier | undefined>;
  getCustomerSupplierStats(tenantId: string, id: string): Promise<{
    totalRevenue: number;
    totalExpense: number;
    transactionCount: number;
    totalGlobalRevenue: number;
    totalGlobalExpense: number;
    monthlyTrend: Array<{ month: string; revenue: number; expense: number }>;
  } | null>;
  reportCustomersSuppliers(tenantId: string, filters: {
    isCustomer?: boolean;
    isSupplier?: boolean;
    isActive?: boolean;
    city?: string;
    state?: string;
    documentType?: string;
    searchName?: string;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<CustomerSupplier[]>;

  // Cash Registers operations - all require tenantId and companyId for multi-tenant isolation
  listCashRegisters(tenantId: string, companyId: string): Promise<CashRegister[]>;
  getCashRegister(tenantId: string, companyId: string, id: string): Promise<CashRegister | undefined>;
  createCashRegister(tenantId: string, companyId: string, register: InsertCashRegister): Promise<CashRegister>;
  updateCashRegister(
    tenantId: string,
    companyId: string,
    id: string,
    register: Partial<InsertCashRegister>
  ): Promise<CashRegister | undefined>;
  deleteCashRegister(tenantId: string, companyId: string, id: string): Promise<boolean>;
  toggleCashRegisterActive(tenantId: string, companyId: string, id: string): Promise<CashRegister | undefined>;

  // Bank Billing Configs operations - all require tenantId and companyId for multi-tenant isolation
  listBankBillingConfigs(tenantId: string, companyId: string): Promise<BankBillingConfig[]>;
  getBankBillingConfig(tenantId: string, companyId: string, bankCode: string): Promise<BankBillingConfig | undefined>;
  upsertBankBillingConfig(
    tenantId: string,
    config: InsertBankBillingConfig
  ): Promise<BankBillingConfig>;
  deleteBankBillingConfig(tenantId: string, companyId: string, bankCode: string): Promise<boolean>;

  // Transactions operations - all require tenantId and companyId for multi-tenant isolation
  listTransactions(
    tenantId: string,
    companyId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: 'expense' | 'revenue';
      status?: string;
      personId?: string;
      costCenterId?: string;
      chartAccountId?: string;
      cashRegisterId?: string;
      query?: string; // Search in title, description, tags
    }
  ): Promise<Transaction[]>;
  getTransaction(tenantId: string, companyId: string, id: string): Promise<Transaction | undefined>;
  createTransaction(
    tenantId: string,
    companyId: string,
    transaction: InsertTransaction,
    userId: string
  ): Promise<Transaction>;
  updateTransaction(
    tenantId: string,
    companyId: string,
    id: string,
    transaction: Partial<InsertTransaction>,
    userId: string
  ): Promise<Transaction | undefined>;
  deleteTransaction(tenantId: string, companyId: string, id: string): Promise<boolean>;
  payTransaction(
    tenantId: string,
    companyId: string,
    id: string,
    payment: {
      paidDate: Date;
      paidAmount?: string;
      bankAccountId?: string;
      paymentMethodId?: string;
      cashRegisterId?: string;
    },
    userId: string
  ): Promise<Transaction | undefined>;
  // Auto-create default cash register if none exists
  ensureDefaultCashRegister(tenantId: string, companyId: string): Promise<CashRegister>;

  // Discovered Companies operations - CNPJ discovery cache (no tenant isolation)
  getDiscoveredCompanyByName(nameNormalized: string): Promise<DiscoveredCompany | undefined>;
  saveDiscoveredCompany(company: InsertDiscoveredCompany): Promise<DiscoveredCompany>;
  incrementDiscoveredCompanyUsage(id: string): Promise<void>;
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

  async upsertUser(userData: { id?: string; email: string; firstName?: string | null; lastName?: string | null; profileImageUrl?: string | null; role?: string; status?: string }): Promise<User> {
    // Prefer lookup by id when provided, otherwise by email
    const existing = userData.id
      ? (await db.select().from(users).where(eq(users.id, userData.id)).limit(1))[0]
      : (await db.select().from(users).where(eq(users.email, userData.email)).limit(1))[0];

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          email: userData.email ?? existing.email,
          firstName: userData.firstName ?? existing.firstName,
          lastName: userData.lastName ?? existing.lastName,
          profileImageUrl: userData.profileImageUrl ?? existing.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(users)
      .values({
        id: userData.id, // allow external id (e.g., OIDC sub)
        email: userData.email,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: userData.role ?? "admin", // grant admin for first OIDC user to be self-tenant
        status: userData.status ?? "active",
      })
      .returning();
    return created;
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

  async clearChildrenChartAccounts(tenantId: string): Promise<string[]> {
    // Delete all accounts with depth > 0 (keep only root accounts)
    const result = await db
      .update(chartOfAccounts)
      .set({
        deleted: true,
        updatedAt: new Date(),
        version: sql`${chartOfAccounts.version} + 1`,
      })
      .where(and(
        eq(chartOfAccounts.tenantId, tenantId),
        gt(chartOfAccounts.depth, 0),
        eq(chartOfAccounts.deleted, false)
      ))
      .returning({ id: chartOfAccounts.id });
    
    return result.map(r => r.id);
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

  // Payment Methods operations

  async listPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(paymentMethods)
      .where(and(
        eq(paymentMethods.tenantId, tenantId),
        eq(paymentMethods.deleted, false)
      ))
      .orderBy(paymentMethods.code);
  }

  async togglePaymentMethod(
    tenantId: string,
    id: string,
    isActive: boolean
  ): Promise<PaymentMethod | undefined> {
    return await db.transaction(async (tx) => {
      // First, verify the record exists and belongs to this tenant
      const [existing] = await tx
        .select()
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.tenantId, tenantId),
          eq(paymentMethods.id, id),
          eq(paymentMethods.deleted, false)
        ));
      
      if (!existing) {
        return undefined; // Not found or doesn't belong to tenant
      }
      
      // Update with optimistic concurrency control (check version)
      const [paymentMethod] = await tx
        .update(paymentMethods)
        .set({
          isActive,
          updatedAt: new Date(),
          version: sql`${paymentMethods.version} + 1`,
        })
        .where(and(
          eq(paymentMethods.tenantId, tenantId),
          eq(paymentMethods.id, id),
          eq(paymentMethods.version, existing.version), // Optimistic lock
          eq(paymentMethods.deleted, false)
        ))
        .returning();
      
      return paymentMethod;
    });
  }

  async seedDefaultPaymentMethods(tenantId: string): Promise<void> {
    // Use advisory lock for thread-safe seeding (similar to other seed methods)
    const lockId = this.hashStringToInt(`payment_methods_seed_${tenantId}`);
    
    await db.transaction(async (tx) => {
      // Acquire advisory lock
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
      
      // Check if already seeded (inside transaction with lock)
      const existing = await tx
        .select()
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.tenantId, tenantId),
          eq(paymentMethods.deleted, false)
        ))
        .limit(1);

      if (existing.length > 0) {
        return; // Already seeded
      }

      // Default payment methods with descriptions and icons
      const defaultMethods = [
        { code: 1, name: "Dinheiro", description: "Pagamento em espécie", icon: "Banknote" },
        { code: 2, name: "Pix", description: "Transferência instantânea via Pix", icon: "Zap" },
        { code: 3, name: "Cartão de Crédito", description: "Pagamento com cartão de crédito", icon: "CreditCard" },
        { code: 4, name: "Cartão de Débito", description: "Pagamento com cartão de débito", icon: "CreditCard" },
        { code: 5, name: "Cheque", description: "Pagamento via cheque bancário", icon: "FileText" },
        { code: 6, name: "Boleto", description: "Pagamento via boleto bancário", icon: "Receipt" },
        { code: 7, name: "Transferência TED", description: "Transferência Eletrônica Disponível", icon: "ArrowRightLeft" },
        { code: 8, name: "Transferência DOC", description: "Documento de Ordem de Crédito", icon: "ArrowRightLeft" },
        { code: 9, name: "DREX", description: "Moeda digital do Banco Central", icon: "Coins" },
        { code: 10, name: "Carteira Digital", description: "PicPay, Mercado Pago, PayPal, etc", icon: "Smartphone" },
        { code: 11, name: "Débito Automático", description: "Pagamentos recorrentes automáticos", icon: "RefreshCw" },
        { code: 12, name: "Crédito em Loja", description: "Carnê ou parcelamento direto", icon: "Store" },
      ];

      await tx.insert(paymentMethods).values(
        defaultMethods.map((method) => ({
          tenantId,
          code: method.code,
          name: method.name,
          description: method.description,
          icon: method.icon,
          isActive: false, // Start with all disabled
        }))
      );
    });
  }

  // Customers/Suppliers operations - all require tenantId for multi-tenant isolation

  async listCustomersSuppliers(tenantId: string): Promise<(CustomerSupplier & { defaultChartAccountFullName?: string; defaultCostCenterName?: string })[]> {
    const results = await db
      .select({
        id: customersSuppliers.id,
        tenantId: customersSuppliers.tenantId,
        code: customersSuppliers.code,
        name: customersSuppliers.name,
        email: customersSuppliers.email,
        phone: customersSuppliers.phone,
        website: customersSuppliers.website,
        documentType: customersSuppliers.documentType,
        document: customersSuppliers.document,
        isCustomer: customersSuppliers.isCustomer,
        isSupplier: customersSuppliers.isSupplier,
        isActive: customersSuppliers.isActive,
        zipCode: customersSuppliers.zipCode,
        street: customersSuppliers.street,
        number: customersSuppliers.number,
        complement: customersSuppliers.complement,
        neighborhood: customersSuppliers.neighborhood,
        city: customersSuppliers.city,
        state: customersSuppliers.state,
        country: customersSuppliers.country,
        bankName: customersSuppliers.bankName,
        accountAgency: customersSuppliers.accountAgency,
        accountNumber: customersSuppliers.accountNumber,
        pixKeyType: customersSuppliers.pixKeyType,
        pixKey: customersSuppliers.pixKey,
        whatsapp: customersSuppliers.whatsapp,
        imageUrl: customersSuppliers.imageUrl,
        notes: customersSuppliers.notes,
        defaultChartAccountId: customersSuppliers.defaultChartAccountId,
        defaultCostCenterId: customersSuppliers.defaultCostCenterId,
        updatedAt: customersSuppliers.updatedAt,
        version: customersSuppliers.version,
        deleted: customersSuppliers.deleted,
        defaultChartAccountFullName: chartOfAccounts.fullPathName,
        defaultCostCenterName: costCenters.name,
      })
      .from(customersSuppliers)
      .leftJoin(
        chartOfAccounts,
        and(
          eq(customersSuppliers.defaultChartAccountId, chartOfAccounts.id),
          eq(chartOfAccounts.tenantId, tenantId),
          eq(chartOfAccounts.deleted, false)
        )
      )
      .leftJoin(
        costCenters,
        and(
          eq(customersSuppliers.defaultCostCenterId, costCenters.id),
          eq(costCenters.tenantId, tenantId),
          eq(costCenters.deleted, false)
        )
      )
      .where(
        and(
          eq(customersSuppliers.tenantId, tenantId),
          eq(customersSuppliers.deleted, false)
        )
      )
      .orderBy(customersSuppliers.code);
    
    return results as (CustomerSupplier & { defaultChartAccountFullName?: string; defaultCostCenterName?: string })[];
  }

  async getCustomerSupplier(tenantId: string, id: string): Promise<CustomerSupplier | undefined> {
    const [entity] = await db
      .select()
      .from(customersSuppliers)
      .where(
        and(
          eq(customersSuppliers.tenantId, tenantId),
          eq(customersSuppliers.id, id),
          eq(customersSuppliers.deleted, false)
        )
      );
    return entity;
  }

  async createCustomerSupplier(
    tenantId: string,
    entityData: InsertCustomerSupplier
  ): Promise<CustomerSupplier> {
    return await db.transaction(async (tx) => {
      // Use advisory lock to ensure thread-safe code generation AND duplicate prevention
      const lockKey = this.hashStringToInt(`customer_supplier_code_${tenantId}`);
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

      // Check for duplicate by name (case-insensitive) and document if provided
      const normalizedName = entityData.name.trim().toLowerCase();
      const duplicateCheck = await tx
        .select()
        .from(customersSuppliers)
        .where(
          and(
            eq(customersSuppliers.tenantId, tenantId),
            eq(customersSuppliers.deleted, false),
            sql`LOWER(TRIM(${customersSuppliers.name})) = ${normalizedName}`
          )
        )
        .limit(1);

      if (duplicateCheck.length > 0) {
        throw new Error(`Já existe um registro com o nome "${entityData.name}"`);
      }

      // If document is provided, also check for duplicate document
      if (entityData.document && entityData.document.trim()) {
        const normalizedDocument = entityData.document.replace(/\D/g, ''); // Remove non-digits
        const docDuplicateCheck = await tx
          .select()
          .from(customersSuppliers)
          .where(
            and(
              eq(customersSuppliers.tenantId, tenantId),
              eq(customersSuppliers.deleted, false),
              sql`REGEXP_REPLACE(${customersSuppliers.document}, '[^0-9]', '', 'g') = ${normalizedDocument}`
            )
          )
          .limit(1);

        if (docDuplicateCheck.length > 0) {
          throw new Error(`Já existe um registro com o documento "${entityData.document}"`);
        }
      }

      // Get the next code number for this tenant
      const result = await tx
        .select({ maxCode: max(customersSuppliers.code) })
        .from(customersSuppliers)
        .where(eq(customersSuppliers.tenantId, tenantId));

      const nextCode = (result[0]?.maxCode ?? 0) + 1;

      // Insert with auto-generated code
      const [entity] = await tx
        .insert(customersSuppliers)
        .values({
          ...entityData,
          tenantId,
          code: nextCode,
        })
        .returning();

      return entity;
    });
  }

  async updateCustomerSupplier(
    tenantId: string,
    id: string,
    entityData: Partial<InsertCustomerSupplier>
  ): Promise<CustomerSupplier | undefined> {
    return await db.transaction(async (tx) => {
      // Get current version for optimistic locking
      const [current] = await tx
        .select()
        .from(customersSuppliers)
        .where(
          and(
            eq(customersSuppliers.tenantId, tenantId),
            eq(customersSuppliers.id, id),
            eq(customersSuppliers.deleted, false)
          )
        );

      if (!current) {
        return undefined;
      }

      // Update with version check (optimistic concurrency)
      const [updated] = await tx
        .update(customersSuppliers)
        .set({
          ...entityData,
          version: sql`${customersSuppliers.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(customersSuppliers.tenantId, tenantId),
            eq(customersSuppliers.id, id),
            eq(customersSuppliers.version, current.version)
          )
        )
        .returning();

      return updated;
    });
  }

  async deleteCustomerSupplier(tenantId: string, id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Soft delete
      const [deleted] = await tx
        .update(customersSuppliers)
        .set({
          deleted: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(customersSuppliers.tenantId, tenantId),
            eq(customersSuppliers.id, id),
            eq(customersSuppliers.deleted, false)
          )
        )
        .returning();

      return !!deleted;
    });
  }

  async toggleCustomerSupplierActive(
    tenantId: string,
    id: string
  ): Promise<CustomerSupplier | undefined> {
    return await db.transaction(async (tx) => {
      // First, verify the record exists and belongs to this tenant
      const [existing] = await tx
        .select()
        .from(customersSuppliers)
        .where(and(
          eq(customersSuppliers.tenantId, tenantId),
          eq(customersSuppliers.id, id),
          eq(customersSuppliers.deleted, false)
        ));
      
      if (!existing) {
        return undefined; // Not found or doesn't belong to tenant
      }
      
      // Toggle isActive status with optimistic concurrency control
      const [entity] = await tx
        .update(customersSuppliers)
        .set({
          isActive: !existing.isActive,
          updatedAt: new Date(),
          version: sql`${customersSuppliers.version} + 1`,
        })
        .where(and(
          eq(customersSuppliers.tenantId, tenantId),
          eq(customersSuppliers.id, id),
          eq(customersSuppliers.version, existing.version), // Optimistic lock
          eq(customersSuppliers.deleted, false)
        ))
        .returning();
      
      return entity;
    });
  }

  async getCustomerSupplierStats(
    tenantId: string,
    id: string
  ): Promise<{
    totalRevenue: number;
    totalExpense: number;
    transactionCount: number;
    totalGlobalRevenue: number;
    totalGlobalExpense: number;
    monthlyTrend: Array<{ month: string; revenue: number; expense: number }>;
  } | null> {
    // First, verify the customer/supplier exists
    const [entity] = await db
      .select()
      .from(customersSuppliers)
      .where(and(
        eq(customersSuppliers.tenantId, tenantId),
        eq(customersSuppliers.id, id),
        eq(customersSuppliers.deleted, false)
      ));

    if (!entity) {
      return null;
    }

    // Get all transactions for this customer/supplier
    const entityTransactions = await db
      .select({
        type: transactions.type,
        amount: transactions.amount,
        dueDate: transactions.dueDate,
      })
      .from(transactions)
      .where(and(
        eq(transactions.tenantId, tenantId),
        eq(transactions.personId, id),
        eq(transactions.deleted, false)
      ));

    // Calculate totals for this entity
    let totalRevenue = 0;
    let totalExpense = 0;

    for (const tx of entityTransactions) {
      const amount = parseFloat(tx.amount || "0");
      if (tx.type === "revenue") {
        totalRevenue += amount;
      } else {
        totalExpense += amount;
      }
    }

    // Get global totals for percentage calculation
    const allTransactions = await db
      .select({
        type: transactions.type,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(and(
        eq(transactions.tenantId, tenantId),
        eq(transactions.deleted, false)
      ));

    let totalGlobalRevenue = 0;
    let totalGlobalExpense = 0;

    for (const tx of allTransactions) {
      const amount = parseFloat(tx.amount || "0");
      if (tx.type === "revenue") {
        totalGlobalRevenue += amount;
      } else {
        totalGlobalExpense += amount;
      }
    }

    // Calculate monthly trend for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData: { [key: string]: { revenue: number; expense: number } } = {};

    for (const tx of entityTransactions) {
      if (tx.dueDate && new Date(tx.dueDate) >= sixMonthsAgo) {
        const monthKey = format(new Date(tx.dueDate), "yyyy-MM");
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, expense: 0 };
        }
        const amount = parseFloat(tx.amount || "0");
        if (tx.type === "revenue") {
          monthlyData[monthKey].revenue += amount;
        } else {
          monthlyData[monthKey].expense += amount;
        }
      }
    }

    // Convert to array and sort by month
    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expense: data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue,
      totalExpense,
      transactionCount: entityTransactions.length,
      totalGlobalRevenue,
      totalGlobalExpense,
      monthlyTrend,
    };
  }

  async reportCustomersSuppliers(
    tenantId: string,
    filters: {
      isCustomer?: boolean;
      isSupplier?: boolean;
      isActive?: boolean;
      city?: string;
      state?: string;
      documentType?: string;
      searchName?: string;
      limit?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<CustomerSupplier[]> {
    // Build dynamic where conditions
    const conditions = [
      eq(customersSuppliers.tenantId, tenantId),
      eq(customersSuppliers.deleted, false),
    ];

    if (filters.isCustomer !== undefined) {
      conditions.push(eq(customersSuppliers.isCustomer, filters.isCustomer));
    }

    if (filters.isSupplier !== undefined) {
      conditions.push(eq(customersSuppliers.isSupplier, filters.isSupplier));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(customersSuppliers.isActive, filters.isActive));
    }

    if (filters.city) {
      conditions.push(
        sql`LOWER(${customersSuppliers.city}) = ${filters.city.toLowerCase()}`
      );
    }

    if (filters.state) {
      conditions.push(eq(customersSuppliers.state, filters.state.toUpperCase()));
    }

    if (filters.documentType) {
      conditions.push(eq(customersSuppliers.documentType, filters.documentType));
    }

    if (filters.searchName) {
      conditions.push(
        sql`LOWER(${customersSuppliers.name}) LIKE ${`%${filters.searchName.toLowerCase()}%`}`
      );
    }

    // Build query with ordering
    const orderField = filters.orderBy || 'code';
    const direction = filters.orderDirection || 'asc';
    
    let orderColumn;
    if (orderField === 'name') {
      orderColumn = customersSuppliers.name;
    } else if (orderField === 'city') {
      orderColumn = customersSuppliers.city;
    } else if (orderField === 'state') {
      orderColumn = customersSuppliers.state;
    } else {
      orderColumn = customersSuppliers.code;
    }

    const query = db
      .select()
      .from(customersSuppliers)
      .where(and(...conditions))
      .orderBy(direction === 'asc' ? orderColumn : desc(orderColumn))
      .$dynamic();

    // Apply limit if provided
    if (filters.limit && filters.limit > 0) {
      return await query.limit(filters.limit);
    }

    return await query;
  }

  // Cash Registers operations - all require tenantId and companyId for multi-tenant isolation

  private async getNextCashRegisterCode(tenantId: string, companyId: string): Promise<number> {
    // Use advisory lock to prevent race conditions
    return await db.transaction(async (tx) => {
      const lockKey = this.hashStringToInt(`cash_register_${tenantId}_${companyId}`);
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

      const [result] = await tx
        .select({ maxCode: max(cashRegisters.code) })
        .from(cashRegisters)
        .where(
          and(
            eq(cashRegisters.tenantId, tenantId),
            eq(cashRegisters.companyId, companyId)
          )
        );

      return (result?.maxCode ?? 0) + 1;
    });
  }

  async listCashRegisters(tenantId: string, companyId: string): Promise<CashRegister[]> {
    const registers = await db
      .select()
      .from(cashRegisters)
      .where(
        and(
          eq(cashRegisters.tenantId, tenantId),
          eq(cashRegisters.companyId, companyId),
          eq(cashRegisters.deleted, false)
        )
      )
      .orderBy(cashRegisters.code);
    
    return registers;
  }

  async getCashRegister(tenantId: string, companyId: string, id: string): Promise<CashRegister | undefined> {
    const [register] = await db
      .select()
      .from(cashRegisters)
      .where(
        and(
          eq(cashRegisters.tenantId, tenantId),
          eq(cashRegisters.companyId, companyId),
          eq(cashRegisters.id, id),
          eq(cashRegisters.deleted, false)
        )
      );
    
    return register;
  }

  async createCashRegister(
    tenantId: string,
    companyId: string,
    registerData: InsertCashRegister
  ): Promise<CashRegister> {
    return await db.transaction(async (tx) => {
      const code = await this.getNextCashRegisterCode(tenantId, companyId);
      
      const [newRegister] = await tx
        .insert(cashRegisters)
        .values({
          ...registerData,
          tenantId,
          companyId,
          code,
        })
        .returning();
      
      return newRegister;
    });
  }

  async updateCashRegister(
    tenantId: string,
    companyId: string,
    id: string,
    registerData: Partial<InsertCashRegister>
  ): Promise<CashRegister | undefined> {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(cashRegisters)
        .set({
          ...registerData,
          updatedAt: new Date(),
          version: sql`${cashRegisters.version} + 1`,
        })
        .where(
          and(
            eq(cashRegisters.tenantId, tenantId),
            eq(cashRegisters.companyId, companyId),
            eq(cashRegisters.id, id),
            eq(cashRegisters.deleted, false)
          )
        )
        .returning();

      return updated;
    });
  }

  async deleteCashRegister(tenantId: string, companyId: string, id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Soft delete
      const [deleted] = await tx
        .update(cashRegisters)
        .set({
          deleted: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(cashRegisters.tenantId, tenantId),
            eq(cashRegisters.companyId, companyId),
            eq(cashRegisters.id, id),
            eq(cashRegisters.deleted, false)
          )
        )
        .returning();

      return !!deleted;
    });
  }

  async toggleCashRegisterActive(
    tenantId: string,
    companyId: string,
    id: string
  ): Promise<CashRegister | undefined> {
    return await db.transaction(async (tx) => {
      // First, verify the record exists and belongs to this tenant and company
      const [existing] = await tx
        .select()
        .from(cashRegisters)
        .where(and(
          eq(cashRegisters.tenantId, tenantId),
          eq(cashRegisters.companyId, companyId),
          eq(cashRegisters.id, id),
          eq(cashRegisters.deleted, false)
        ));
      
      if (!existing) {
        return undefined; // Not found or doesn't belong to tenant/company
      }
      
      // Toggle isActive status with optimistic concurrency control
      const [register] = await tx
        .update(cashRegisters)
        .set({
          isActive: !existing.isActive,
          updatedAt: new Date(),
          version: sql`${cashRegisters.version} + 1`,
        })
        .where(and(
          eq(cashRegisters.tenantId, tenantId),
          eq(cashRegisters.companyId, companyId),
          eq(cashRegisters.id, id),
          eq(cashRegisters.version, existing.version), // Optimistic lock
          eq(cashRegisters.deleted, false)
        ))
        .returning();
      
      return register;
    });
  }

  // Bank Billing Configs operations - all require tenantId and companyId for multi-tenant isolation
  async listBankBillingConfigs(tenantId: string, companyId: string): Promise<BankBillingConfig[]> {
    const configs = await db
      .select()
      .from(bankBillingConfigs)
      .where(
        and(
          eq(bankBillingConfigs.tenantId, tenantId),
          eq(bankBillingConfigs.companyId, companyId),
          eq(bankBillingConfigs.deleted, false)
        )
      )
      .orderBy(bankBillingConfigs.bankName);
    
    return configs;
  }

  async getBankBillingConfig(tenantId: string, companyId: string, bankCode: string): Promise<BankBillingConfig | undefined> {
    const [config] = await db
      .select()
      .from(bankBillingConfigs)
      .where(
        and(
          eq(bankBillingConfigs.tenantId, tenantId),
          eq(bankBillingConfigs.companyId, companyId),
          eq(bankBillingConfigs.bankCode, bankCode),
          eq(bankBillingConfigs.deleted, false)
        )
      );
    
    return config;
  }

  async upsertBankBillingConfig(
    tenantId: string,
    configData: InsertBankBillingConfig
  ): Promise<BankBillingConfig> {
    return await db.transaction(async (tx) => {
      // Check if config already exists for this bank and company
      const [existing] = await tx
        .select()
        .from(bankBillingConfigs)
        .where(
          and(
            eq(bankBillingConfigs.tenantId, tenantId),
            eq(bankBillingConfigs.companyId, configData.companyId),
            eq(bankBillingConfigs.bankCode, configData.bankCode),
            eq(bankBillingConfigs.deleted, false)
          )
        );

      if (existing) {
        // Update existing config
        const [updated] = await tx
          .update(bankBillingConfigs)
          .set({
            ...configData,
            updatedAt: new Date(),
            version: sql`${bankBillingConfigs.version} + 1`,
          })
          .where(
            and(
              eq(bankBillingConfigs.tenantId, tenantId),
              eq(bankBillingConfigs.companyId, configData.companyId),
              eq(bankBillingConfigs.bankCode, configData.bankCode),
              eq(bankBillingConfigs.version, existing.version), // Optimistic lock
              eq(bankBillingConfigs.deleted, false)
            )
          )
          .returning();

        return updated;
      } else {
        // Create new config
        const [created] = await tx
          .insert(bankBillingConfigs)
          .values({
            ...configData,
            tenantId,
          })
          .returning();

        return created;
      }
    });
  }

  async deleteBankBillingConfig(tenantId: string, companyId: string, bankCode: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Soft delete
      const [deleted] = await tx
        .update(bankBillingConfigs)
        .set({
          deleted: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bankBillingConfigs.tenantId, tenantId),
            eq(bankBillingConfigs.companyId, companyId),
            eq(bankBillingConfigs.bankCode, bankCode),
            eq(bankBillingConfigs.deleted, false)
          )
        )
        .returning();

      return !!deleted;
    });
  }

  // Transactions operations - all require tenantId and companyId for multi-tenant isolation

  // Ensure default cash register exists (auto-create if needed)
  async ensureDefaultCashRegister(tenantId: string, companyId: string): Promise<CashRegister> {
    // Check if any cash register exists
    const existing = await db
      .select()
      .from(cashRegisters)
      .where(
        and(
          eq(cashRegisters.tenantId, tenantId),
          eq(cashRegisters.companyId, companyId),
          eq(cashRegisters.deleted, false)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // No cash register exists, create default one
    const [cashRegister] = await db
      .insert(cashRegisters)
      .values({
        tenantId,
        companyId,
        code: 1, // First cash register
        name: "Caixa Principal",
        isActive: true,
        isOpen: true, // Always open in automatic mode
        currentBalance: "0",
        openingBalance: "0",
      })
      .returning();

    return cashRegister;
  }

  async listTransactions(
    tenantId: string,
    companyId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: 'expense' | 'revenue';
      status?: string;
      personId?: string;
      costCenterId?: string;
      chartAccountId?: string;
      cashRegisterId?: string;
      query?: string;
    }
  ): Promise<Transaction[]> {
    const conditions = [
      eq(transactions.tenantId, tenantId),
      eq(transactions.companyId, companyId),
      eq(transactions.deleted, false),
    ];

    if (filters) {
      if (filters.startDate) {
        conditions.push(gte(transactions.dueDate, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(transactions.dueDate, filters.endDate));
      }
      if (filters.type) {
        conditions.push(eq(transactions.type, filters.type));
      }
      if (filters.status) {
        conditions.push(eq(transactions.status, filters.status));
      }
      if (filters.personId) {
        conditions.push(eq(transactions.personId, filters.personId));
      }
      if (filters.costCenterId) {
        conditions.push(eq(transactions.costCenterId, filters.costCenterId));
      }
      if (filters.chartAccountId) {
        conditions.push(eq(transactions.chartAccountId, filters.chartAccountId));
      }
      if (filters.cashRegisterId) {
        conditions.push(eq(transactions.cashRegisterId, filters.cashRegisterId));
      }
      if (filters.query) {
        // Search in title and description
        conditions.push(
          or(
            like(transactions.title, `%${filters.query}%`),
            like(transactions.description, `%${filters.query}%`)
          )!
        );
      }
    }

    const results = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.dueDate));

    return results;
  }

  async getTransaction(tenantId: string, companyId: string, id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.companyId, companyId),
          eq(transactions.id, id),
          eq(transactions.deleted, false)
        )
      );

    return transaction;
  }

  async createTransaction(
    tenantId: string,
    companyId: string,
    transactionData: InsertTransaction,
    userId: string
  ): Promise<Transaction> {
    return await db.transaction(async (tx) => {
      // If this is a paid transaction and no cash register is specified, ensure default exists
      if (transactionData.status === 'paid' && !transactionData.cashRegisterId) {
        const defaultCashRegister = await this.ensureDefaultCashRegister(tenantId, companyId);
        transactionData.cashRegisterId = defaultCashRegister.id;
      }

      const [transaction] = await tx
        .insert(transactions)
        .values({
          ...transactionData,
          tenantId,
          companyId,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      return transaction;
    });
  }

  async updateTransaction(
    tenantId: string,
    companyId: string,
    id: string,
    transactionData: Partial<InsertTransaction>,
    userId: string
  ): Promise<Transaction | undefined> {
    return await db.transaction(async (tx) => {
      // Get current version for optimistic locking
      const [existing] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.tenantId, tenantId),
            eq(transactions.companyId, companyId),
            eq(transactions.id, id),
            eq(transactions.deleted, false)
          )
        );

      if (!existing) return undefined;

      const [updated] = await tx
        .update(transactions)
        .set({
          ...transactionData,
          updatedBy: userId,
          updatedAt: new Date(),
          version: sql`${transactions.version} + 1`,
        })
        .where(
          and(
            eq(transactions.tenantId, tenantId),
            eq(transactions.companyId, companyId),
            eq(transactions.id, id),
            eq(transactions.version, existing.version), // Optimistic lock
            eq(transactions.deleted, false)
          )
        )
        .returning();

      return updated;
    });
  }

  async deleteTransaction(tenantId: string, companyId: string, id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const [deleted] = await tx
        .update(transactions)
        .set({
          deleted: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(transactions.tenantId, tenantId),
            eq(transactions.companyId, companyId),
            eq(transactions.id, id),
            eq(transactions.deleted, false)
          )
        )
        .returning();

      return !!deleted;
    });
  }

  async payTransaction(
    tenantId: string,
    companyId: string,
    id: string,
    payment: {
      paidDate: Date;
      paidAmount?: string;
      bankAccountId?: string;
      paymentMethodId?: string;
      cashRegisterId?: string;
    },
    userId: string
  ): Promise<Transaction | undefined> {
    return await db.transaction(async (tx) => {
      // Get existing transaction
      const [existing] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.tenantId, tenantId),
            eq(transactions.companyId, companyId),
            eq(transactions.id, id),
            eq(transactions.deleted, false)
          )
        );

      if (!existing) return undefined;

      // If no cash register specified, ensure default exists
      let cashRegisterId = payment.cashRegisterId;
      if (!cashRegisterId) {
        const defaultCashRegister = await this.ensureDefaultCashRegister(tenantId, companyId);
        cashRegisterId = defaultCashRegister.id;
      }

      const [updated] = await tx
        .update(transactions)
        .set({
          status: 'paid',
          paidDate: payment.paidDate,
          paidAmount: payment.paidAmount || existing.amount,
          bankAccountId: payment.bankAccountId,
          paymentMethodId: payment.paymentMethodId,
          cashRegisterId,
          updatedBy: userId,
          updatedAt: new Date(),
          version: sql`${transactions.version} + 1`,
        })
        .where(
          and(
            eq(transactions.tenantId, tenantId),
            eq(transactions.companyId, companyId),
            eq(transactions.id, id),
            eq(transactions.version, existing.version), // Optimistic lock
            eq(transactions.deleted, false)
          )
        )
        .returning();

      return updated;
    });
  }

  // Discovered Companies methods - CNPJ discovery cache
  async getDiscoveredCompanyByName(nameNormalized: string): Promise<DiscoveredCompany | undefined> {
    const [result] = await db
      .select()
      .from(discoveredCompanies)
      .where(eq(discoveredCompanies.nameNormalized, nameNormalized))
      .limit(1);

    return result;
  }

  async saveDiscoveredCompany(company: InsertDiscoveredCompany): Promise<DiscoveredCompany> {
    // Try to insert, if already exists due to unique constraint, update it
    const [result] = await db
      .insert(discoveredCompanies)
      .values(company)
      .onConflictDoUpdate({
        target: discoveredCompanies.nameNormalized,
        set: {
          cnpj: company.cnpj,
          legalName: company.legalName,
          source: company.source,
          confidence: company.confidence,
          searchQuery: company.searchQuery,
          googleSnippet: company.googleSnippet,
          timesUsed: sql`${discoveredCompanies.timesUsed} + 1`,
          lastUsedAt: new Date(),
        },
      })
      .returning();

    return result;
  }

  async incrementDiscoveredCompanyUsage(id: string): Promise<void> {
    await db
      .update(discoveredCompanies)
      .set({
        timesUsed: sql`${discoveredCompanies.timesUsed} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(discoveredCompanies.id, id));
  }
}

export const storage = new DatabaseStorage();
