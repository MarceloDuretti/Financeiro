// Local authentication system
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCompanySchema, 
  insertCompanyMemberSchema,
  insertCostCenterSchema,
  insertChartAccountSchema,
  insertBankAccountSchema,
  insertPixKeySchema,
  togglePaymentMethodSchema,
  insertCustomerSupplierSchema,
  insertCashRegisterSchema,
  insertBankBillingConfigSchema,
  insertTransactionSchema,
  loginSchema, 
  signupSchema,
  createCollaboratorSchema,
  acceptInviteSchema,
} from "@shared/schema";
import { setupAuth, isAuthenticated, hashPassword } from "./localAuth";
import { initializeEmailService, sendInviteEmail } from "./emailService";
import { getTenantId } from "./tenantUtils";
import { broadcastDataChange } from "./websocket";
import { db } from "./db";
import { sql } from "drizzle-orm";
import passport from "passport";
import { nanoid } from "nanoid";

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Acesso negado. Apenas administradores podem executar esta ação." });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - must be first
  await setupAuth(app);
  
  // Initialize email service
  initializeEmailService();

  // Auth routes - Login
  app.post("/api/auth/login", (req, res, next) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Erro interno do servidor" });
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Email ou senha incorretos" });
        }
        
        req.logIn(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Erro ao fazer login" });
          }
          res.json(user);
        });
      })(req, res, next);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  // Auth routes - Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está cadastrado" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user as admin (users who self-register are admins)
      const newUser = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: "admin",
        status: "active",
      });

      // SECURITY: Re-fetch user from storage to ensure canonical data
      // This prevents privilege escalation attacks by ensuring we only
      // pass verified, sanitized data to req.logIn()
      const storedUser = await storage.getUser(newUser.id);
      if (!storedUser) {
        return res.status(500).json({ message: "Erro ao criar conta" });
      }

      // SECURITY: Remove sensitive fields before login
      const { password: _, ...sanitizedUser } = storedUser;

      // Auto-login after signup with sanitized user object
      req.logIn(sanitizedUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Conta criada, mas erro ao fazer login" });
        }
        
        res.json(sanitizedUser);
      });
    } catch (error: any) {
      console.error("Error during signup:", error);
      res.status(400).json({ message: error.message || "Erro ao criar conta" });
    }
  });

  // Auth routes - Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Auth routes - Get current user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected companies routes - with tenant isolation
  app.get("/api/companies", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const companies = await storage.listCompanies(tenantId);
      res.json(companies);
    } catch (error) {
      console.error("Error listing companies:", error);
      res.status(500).json({ error: "Failed to list companies" });
    }
  });

  app.post("/api/companies", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const companyData = insertCompanySchema.omit({ tenantId: true, code: true }).parse(req.body);
      
      const company = await storage.createCompany(tenantId, companyData);
      res.json(company);
    } catch (error: any) {
      console.error("Error creating company:", error);
      res.status(400).json({ error: error.message || "Invalid company data" });
    }
  });

  app.get("/api/companies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const company = await storage.getCompanyById(tenantId, req.params.id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error getting company:", error);
      res.status(500).json({ error: "Failed to get company" });
    }
  });

  app.patch("/api/companies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const updates = insertCompanySchema.partial().parse(req.body);
      
      // SECURITY: Remove tenantId from updates to prevent tenant hijacking
      const { tenantId: _, ...safeUpdates } = updates;
      
      const company = await storage.updateCompany(tenantId, req.params.id, safeUpdates);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(400).json({ error: "Invalid company data" });
    }
  });

  app.delete("/api/companies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const deleted = await storage.deleteCompany(tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Company Dashboard - Analytics
  app.get("/api/companies/:id/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const companyId = req.params.id;
      
      // Verificar se a empresa pertence ao tenant
      const company = await storage.getCompanyById(tenantId, companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Buscar todas as transações da empresa
      const transactions = await storage.listTransactions(tenantId, companyId);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);
      
      const last30Days = new Date(now);
      last30Days.setDate(last30Days.getDate() - 30);

      // Agregar dados
      const dashboard = {
        today: { revenue: 0, expense: 0, balance: 0 },
        month: { revenue: 0, expense: 0, balance: 0 },
        year: { revenue: 0, expense: 0, balance: 0 },
        cashFlow: [] as Array<{ date: string; revenue: number; expense: number; balance: number }>,
      };

      // Processar transações
      transactions.forEach((tx: any) => {
        const txDate = new Date(tx.date);
        const amount = parseFloat(tx.totalAmount || '0');
        const isRevenue = tx.transactionType === 'Receita';

        // Hoje (>= today e < tomorrow)
        if (txDate >= today && txDate < tomorrow) {
          if (isRevenue) {
            dashboard.today.revenue += amount;
          } else {
            dashboard.today.expense += amount;
          }
        }

        // Mês (>= startOfMonth e < startOfNextMonth)
        if (txDate >= startOfMonth && txDate < startOfNextMonth) {
          if (isRevenue) {
            dashboard.month.revenue += amount;
          } else {
            dashboard.month.expense += amount;
          }
        }

        // Ano (>= startOfYear e < startOfNextYear)
        if (txDate >= startOfYear && txDate < startOfNextYear) {
          if (isRevenue) {
            dashboard.year.revenue += amount;
          } else {
            dashboard.year.expense += amount;
          }
        }
      });

      // Calcular saldos
      dashboard.today.balance = dashboard.today.revenue - dashboard.today.expense;
      dashboard.month.balance = dashboard.month.revenue - dashboard.month.expense;
      dashboard.year.balance = dashboard.year.revenue - dashboard.year.expense;

      // Gerar dados do fluxo de caixa (últimos 30 dias, até hoje inclusive)
      const cashFlowMap = new Map<string, { revenue: number; expense: number }>();
      
      transactions.forEach((tx: any) => {
        const txDate = new Date(tx.date);
        if (txDate >= last30Days && txDate < tomorrow) {
          const dateStr = txDate.toISOString().split('T')[0];
          const existing = cashFlowMap.get(dateStr) || { revenue: 0, expense: 0 };
          const amount = parseFloat(tx.totalAmount || '0');
          
          if (tx.transactionType === 'Receita') {
            existing.revenue += amount;
          } else {
            existing.expense += amount;
          }
          
          cashFlowMap.set(dateStr, existing);
        }
      });

      // Converter para array e ordenar
      dashboard.cashFlow = Array.from(cashFlowMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          expense: data.expense,
          balance: data.revenue - data.expense,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json(dashboard);
    } catch (error) {
      console.error("Error getting company dashboard:", error);
      res.status(500).json({ error: "Failed to get company dashboard" });
    }
  });

  // Company Members routes - with tenant isolation

  app.get("/api/companies/:companyId/members", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const members = await storage.listCompanyMembers(tenantId, req.params.companyId);
      res.json(members);
    } catch (error) {
      console.error("Error listing company members:", error);
      res.status(500).json({ error: "Failed to list company members" });
    }
  });

  app.post("/api/companies/:companyId/members", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const memberData = insertCompanyMemberSchema.parse(req.body);
      
      // companyId comes from URL, tenantId from authenticated user
      const member = await storage.createCompanyMember(tenantId, req.params.companyId, memberData);
      
      res.json(member);
    } catch (error: any) {
      console.error("Error creating company member:", error);
      res.status(400).json({ error: error.message || "Invalid member data" });
    }
  });

  app.patch("/api/companies/:companyId/members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const updates = insertCompanyMemberSchema.partial().parse(req.body);
      
      // tenantId and companyId already omitted from schema, so no need to strip them
      const member = await storage.updateCompanyMember(tenantId, req.params.id, updates);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error updating company member:", error);
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.delete("/api/companies/:companyId/members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const deleted = await storage.deleteCompanyMember(tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json({ message: "Member deleted successfully" });
    } catch (error) {
      console.error("Error deleting company member:", error);
      res.status(500).json({ error: "Failed to delete company member" });
    }
  });

  // Cost Centers routes - with tenant isolation

  app.get("/api/cost-centers", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const costCenters = await storage.listCostCenters(tenantId);
      res.json(costCenters);
    } catch (error) {
      console.error("Error listing cost centers:", error);
      res.status(500).json({ error: "Failed to list cost centers" });
    }
  });

  app.get("/api/cost-centers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const costCenter = await storage.getCostCenterById(tenantId, req.params.id);
      if (!costCenter) {
        return res.status(404).json({ error: "Cost center not found" });
      }
      res.json(costCenter);
    } catch (error) {
      console.error("Error getting cost center:", error);
      res.status(500).json({ error: "Failed to get cost center" });
    }
  });

  app.post("/api/cost-centers", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const costCenterData = insertCostCenterSchema.parse(req.body);
      const costCenter = await storage.createCostCenter(tenantId, costCenterData);
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "cost-centers", "created", costCenter);
      
      res.status(201).json(costCenter);
    } catch (error: any) {
      console.error("Error creating cost center:", error);
      res.status(400).json({ error: error.message || "Invalid cost center data" });
    }
  });

  app.patch("/api/cost-centers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const updates = insertCostCenterSchema.partial().parse(req.body);
      const costCenter = await storage.updateCostCenter(tenantId, req.params.id, updates);
      if (!costCenter) {
        return res.status(404).json({ error: "Cost center not found" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "cost-centers", "updated", costCenter);
      
      res.json(costCenter);
    } catch (error) {
      console.error("Error updating cost center:", error);
      res.status(400).json({ error: "Invalid cost center data" });
    }
  });

  app.delete("/api/cost-centers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const deleted = await storage.deleteCostCenter(tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Cost center not found" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "cost-centers", "deleted", { id: req.params.id });
      
      res.json({ message: "Cost center deleted successfully" });
    } catch (error) {
      console.error("Error deleting cost center:", error);
      res.status(500).json({ error: "Failed to delete cost center" });
    }
  });

  // Collaborators routes (admin only)

  // List collaborators - with tenant isolation
  app.get("/api/collaborators", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const tenantId = getTenantId(req.user);
      const collaborators = await storage.listCollaborators(tenantId);
      
      // Get companies for each collaborator (using tenantId for isolation)
      const collaboratorsWithCompanies = await Promise.all(
        collaborators.map(async (collab) => {
          const companies = await storage.getUserCompanies(tenantId, collab.id);
          const { password: _, inviteToken: __, inviteTokenExpiry: ___, ...sanitizedCollab } = collab;
          return {
            ...sanitizedCollab,
            companies,
          };
        })
      );
      
      res.json(collaboratorsWithCompanies);
    } catch (error) {
      console.error("Error listing collaborators:", error);
      res.status(500).json({ error: "Failed to list collaborators" });
    }
  });

  // Create collaborator (with invite email)
  app.post("/api/collaborators", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const validatedData = createCollaboratorSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está cadastrado" });
      }

      // Generate invite token
      const inviteToken = nanoid(32);
      const inviteTokenExpiry = new Date();
      inviteTokenExpiry.setDate(inviteTokenExpiry.getDate() + 7); // 7 days expiry

      // Create collaborator (without password - will be set on first access)
      const collaborator = await storage.createUser({
        email: validatedData.email,
        password: undefined as any, // Will be set when they accept invite
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: "collaborator",
        adminId,
        status: "pending_first_access",
        inviteToken,
        inviteTokenExpiry,
      });

      // Create user-company relationships (with tenant isolation)
      await Promise.all(
        validatedData.companyIds.map(async (companyId) => {
          await storage.createUserCompany(adminId, {
            userId: collaborator.id,
            companyId,
          });
        })
      );

      // Send invite email
      const inviteLink = `${req.protocol}://${req.get("host")}/accept-invite/${inviteToken}`;
      const adminName = `${req.user.firstName} ${req.user.lastName || ""}`.trim();
      
      const emailSent = await sendInviteEmail(
        validatedData.email,
        validatedData.firstName,
        inviteLink,
        adminName
      );

      if (!emailSent) {
        console.warn("⚠️ Failed to send invite email, but user was created");
      }

      const { password: _, inviteToken: __, inviteTokenExpiry: ___, ...sanitizedCollab } = collaborator;
      res.json({
        ...sanitizedCollab,
        emailSent,
      });
    } catch (error: any) {
      console.error("Error creating collaborator:", error);
      res.status(400).json({ message: error.message || "Failed to create collaborator" });
    }
  });

  // Update collaborator status (activate/deactivate)
  app.patch("/api/collaborators/:id/status", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Status deve ser 'active' ou 'inactive'" });
      }

      // Verify collaborator belongs to this admin
      const collaborator = await storage.getUser(id);
      if (!collaborator || collaborator.adminId !== req.user.id) {
        return res.status(404).json({ message: "Colaborador não encontrado" });
      }

      const updatedUser = await storage.updateUser(id, { status });
      const { password: _, inviteToken: __, inviteTokenExpiry: ___, ...sanitized } = updatedUser!;
      res.json(sanitized);
    } catch (error) {
      console.error("Error updating collaborator status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Resend invite email
  app.post("/api/collaborators/:id/resend-invite", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Verify collaborator belongs to this admin
      const collaborator = await storage.getUser(id);
      if (!collaborator || collaborator.adminId !== req.user.id) {
        return res.status(404).json({ message: "Colaborador não encontrado" });
      }

      if (collaborator.status !== "pending_first_access") {
        return res.status(400).json({ message: "Colaborador já ativou a conta" });
      }

      // Generate new invite token
      const inviteToken = nanoid(32);
      const inviteTokenExpiry = new Date();
      inviteTokenExpiry.setDate(inviteTokenExpiry.getDate() + 7);

      await storage.updateUser(id, {
        inviteToken,
        inviteTokenExpiry,
      });

      // Send invite email
      const inviteLink = `${req.protocol}://${req.get("host")}/accept-invite/${inviteToken}`;
      const adminName = `${req.user.firstName} ${req.user.lastName || ""}`.trim();
      
      const emailSent = await sendInviteEmail(
        collaborator.email,
        collaborator.firstName || "",
        inviteLink,
        adminName
      );

      res.json({
        message: emailSent ? "Convite reenviado com sucesso" : "Erro ao enviar email",
        emailSent,
      });
    } catch (error) {
      console.error("Error resending invite:", error);
      res.status(500).json({ error: "Failed to resend invite" });
    }
  });

  // Accept invite (public route - no auth required)
  app.post("/api/accept-invite", async (req, res) => {
    try {
      const validatedData = acceptInviteSchema.parse(req.body);
      
      // Find user by invite token
      const user = await storage.getUserByInviteToken(validatedData.token);
      if (!user) {
        return res.status(404).json({ message: "Convite inválido ou expirado" });
      }

      // Check if token is expired
      if (user.inviteTokenExpiry && new Date() > new Date(user.inviteTokenExpiry)) {
        return res.status(400).json({ message: "Convite expirado. Solicite um novo convite ao administrador." });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Update user: set password, activate, clear token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        status: "active",
        inviteToken: null as any,
        inviteTokenExpiry: null as any,
      });

      res.json({ message: "Senha definida com sucesso. Você já pode fazer login." });
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      res.status(400).json({ message: error.message || "Failed to accept invite" });
    }
  });

  // Chart of Accounts routes (authenticated + multi-tenant)
  
  // List all accounts (hierarchical tree)
  app.get("/api/chart-of-accounts", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      let accounts = await storage.listChartOfAccounts(tenantId);
      
      // Auto-seed default structure on first access (when empty)
      if (accounts.length === 0) {
        await storage.seedDefaultChartAccounts(tenantId);
        accounts = await storage.listChartOfAccounts(tenantId);
      }
      
      res.json(accounts);
    } catch (error) {
      console.error("Error listing chart of accounts:", error);
      res.status(500).json({ error: "Failed to list chart of accounts" });
    }
  });

  // Create new account
  app.post("/api/chart-of-accounts", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const validatedData = insertChartAccountSchema.parse(req.body);
      
      const account = await storage.createChartAccount(tenantId, validatedData);
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "chart-of-accounts", "created", account);
      
      res.status(201).json(account);
    } catch (error: any) {
      console.error("Error creating chart account:", error);
      res.status(400).json({ message: error.message || "Failed to create account" });
    }
  });

  // Update account
  app.patch("/api/chart-of-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      // Check if this is a root account (protection)
      const existingAccount = await storage.getChartAccount(tenantId, id);
      if (!existingAccount) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }
      
      if (existingAccount.parentId === null) {
        return res.status(403).json({ 
          message: "Não é permitido editar contas raiz do sistema" 
        });
      }
      
      // Strip tenantId, code, parentId from payload (security)
      const { tenantId: _, code: __, parentId: ___, ...updates } = req.body;
      
      const account = await storage.updateChartAccount(tenantId, id, updates);
      if (!account) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "chart-of-accounts", "updated", account);
      
      res.json(account);
    } catch (error: any) {
      console.error("Error updating chart account:", error);
      res.status(400).json({ message: error.message || "Failed to update account" });
    }
  });

  // Clear all children accounts (keep only root accounts)
  app.delete("/api/chart-of-accounts/clear-children", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      
      const deletedIds = await storage.clearChildrenChartAccounts(tenantId);
      
      // Broadcast deletion for each account to update all connected clients
      deletedIds.forEach(id => {
        broadcastDataChange(tenantId, "chart-of-accounts", "deleted", { id });
      });
      
      res.json({ 
        message: `${deletedIds.length} subconta(s) excluída(s) com sucesso`,
        deletedCount: deletedIds.length 
      });
    } catch (error: any) {
      console.error("Error clearing children chart accounts:", error);
      res.status(500).json({ message: error.message || "Erro ao limpar subcontas" });
    }
  });

  // Delete account (soft-delete)
  app.delete("/api/chart-of-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      // Check if this is a root account (protection)
      const existingAccount = await storage.getChartAccount(tenantId, id);
      if (!existingAccount) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }
      
      if (existingAccount.parentId === null) {
        return res.status(403).json({ 
          message: "Não é permitido excluir contas raiz do sistema" 
        });
      }
      
      const success = await storage.deleteChartAccount(tenantId, id);
      if (!success) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "chart-of-accounts", "deleted", { id });
      
      res.json({ message: "Conta excluída com sucesso" });
    } catch (error: any) {
      console.error("Error deleting chart account:", error);
      res.status(400).json({ message: error.message || "Failed to delete account" });
    }
  });

  // Generate chart of accounts with AI
  app.post("/api/chart-of-accounts/generate-with-ai", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { businessDescription } = req.body;

      if (!businessDescription || typeof businessDescription !== "string") {
        return res.status(400).json({ message: "Descrição do negócio é obrigatória" });
      }

      // Import AI service
      const { generateChartOfAccounts } = await import("./ai-service");

      // Generate accounts using AI
      const generatedAccounts = await generateChartOfAccounts(businessDescription);

      res.json({ accounts: generatedAccounts });
    } catch (error: any) {
      console.error("Error generating chart with AI:", error);
      res.status(500).json({ message: error.message || "Erro ao gerar plano de contas" });
    }
  });

  // Confirm and insert AI-generated accounts
  app.post("/api/chart-of-accounts/confirm-ai-generated", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { accounts } = req.body;

      if (!Array.isArray(accounts) || accounts.length === 0) {
        return res.status(400).json({ message: "Lista de contas inválida" });
      }

      // Check if chart is empty (only root accounts should exist)
      const existingAccounts = await storage.listChartOfAccounts(tenantId);
      const nonRootAccounts = existingAccounts.filter(acc => acc.parentId !== null);
      
      if (nonRootAccounts.length > 0) {
        return res.status(400).json({ 
          message: "Plano de contas já possui subcontas. Exclua-as antes de usar o assistente." 
        });
      }

      // Create a map to store account IDs by code
      const accountMap = new Map<string, string>();
      
      // First, map root accounts (1,2,3,4,5) to their IDs
      for (const rootAccount of existingAccounts) {
        // Map based on type
        const typeToCode: Record<string, string> = {
          'receita': '1',
          'despesa': '2',
          'ativo': '3',
          'passivo': '4',
          'patrimonio_liquido': '5',
        };
        const code = typeToCode[rootAccount.type];
        if (code) {
          accountMap.set(code, rootAccount.id);
        }
      }

      // Sort accounts by code hierarchy (parents before children)
      const sortedAccounts = [...accounts].sort((a, b) => {
        const aDepth = a.code.split('.').length;
        const bDepth = b.code.split('.').length;
        if (aDepth !== bDepth) return aDepth - bDepth;
        return a.code.localeCompare(b.code);
      });

      // Insert accounts in order
      const createdAccounts = [];
      const rootCodes = ['1', '2', '3', '4', '5'];
      
      for (const account of sortedAccounts) {
        // Skip root accounts (1-5) - they already exist in the database
        if (rootCodes.includes(account.code)) {
          console.log(`[AI Chart Confirm] Skipping root account: ${account.code} - ${account.name} (already exists)`);
          continue;
        }
        
        // Find parent ID
        let parentId: string | null = null;
        if (account.parentCode) {
          parentId = accountMap.get(account.parentCode) || null;
        }

        if (!parentId && account.parentCode) {
          console.warn(`Parent not found for account ${account.code}, parent code: ${account.parentCode}`);
          continue; // Skip if parent not found
        }

        // Create account
        const created = await storage.createChartAccount(tenantId, {
          name: account.name,
          type: account.type,
          description: account.description || "",
          parentId,
        });

        // Store in map for children
        accountMap.set(account.code, created.id);
        createdAccounts.push(created);

        // Broadcast creation
        broadcastDataChange(tenantId, "chart-of-accounts", "created", created);
      }

      res.json({ 
        message: `${createdAccounts.length} contas criadas com sucesso`,
        accounts: createdAccounts 
      });
    } catch (error: any) {
      console.error("Error confirming AI-generated accounts:", error);
      res.status(500).json({ message: error.message || "Erro ao criar contas" });
    }
  });

  // Bank Accounts routes (authenticated + multi-tenant)

  // List all bank accounts
  app.get("/api/bank-accounts", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const accounts = await storage.listBankAccounts(tenantId);
      res.json(accounts);
    } catch (error) {
      console.error("Error listing bank accounts:", error);
      res.status(500).json({ error: "Failed to list bank accounts" });
    }
  });

  // Get single bank account
  app.get("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const account = await storage.getBankAccount(tenantId, id);
      if (!account) {
        return res.status(404).json({ message: "Conta bancária não encontrada" });
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error getting bank account:", error);
      res.status(500).json({ error: "Failed to get bank account" });
    }
  });

  // Create new bank account
  app.post("/api/bank-accounts", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const validatedData = insertBankAccountSchema.parse(req.body);
      
      const account = await storage.createBankAccount(tenantId, validatedData);
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "bank-accounts", "created", account);
      
      res.status(201).json(account);
    } catch (error: any) {
      console.error("Error creating bank account:", error);
      res.status(400).json({ message: error.message || "Failed to create bank account" });
    }
  });

  // Update bank account
  app.patch("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      // Strip tenantId from payload (security)
      const { tenantId: _, ...updates } = req.body;
      
      const account = await storage.updateBankAccount(tenantId, id, updates);
      if (!account) {
        return res.status(404).json({ message: "Conta bancária não encontrada" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "bank-accounts", "updated", account);
      
      res.json(account);
    } catch (error: any) {
      console.error("Error updating bank account:", error);
      res.status(400).json({ message: error.message || "Failed to update bank account" });
    }
  });

  // Delete bank account (soft-delete)
  app.delete("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const success = await storage.deleteBankAccount(tenantId, id);
      if (!success) {
        return res.status(404).json({ message: "Conta bancária não encontrada" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "bank-accounts", "deleted", { id });
      
      res.json({ message: "Conta bancária excluída com sucesso" });
    } catch (error: any) {
      console.error("Error deleting bank account:", error);
      res.status(400).json({ message: error.message || "Failed to delete bank account" });
    }
  });

  // PIX Keys routes (authenticated + multi-tenant)

  // List all PIX keys for a bank account
  app.get("/api/bank-accounts/:bankAccountId/pix-keys", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { bankAccountId } = req.params;
      
      // Verify bank account belongs to this tenant
      const account = await storage.getBankAccount(tenantId, bankAccountId);
      if (!account) {
        return res.status(404).json({ message: "Conta bancária não encontrada" });
      }
      
      const pixKeys = await storage.listPixKeysByAccount(tenantId, bankAccountId);
      res.json(pixKeys);
    } catch (error) {
      console.error("Error listing PIX keys:", error);
      res.status(500).json({ error: "Failed to list PIX keys" });
    }
  });

  // Create new PIX key
  app.post("/api/bank-accounts/:bankAccountId/pix-keys", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { bankAccountId } = req.params;
      
      // Verify bank account belongs to this tenant
      const account = await storage.getBankAccount(tenantId, bankAccountId);
      if (!account) {
        return res.status(404).json({ message: "Conta bancária não encontrada" });
      }
      
      const validatedData = insertPixKeySchema.parse(req.body);
      const pixKey = await storage.createPixKey(tenantId, bankAccountId, validatedData);
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "pix-keys", "created", pixKey);
      
      res.status(201).json(pixKey);
    } catch (error: any) {
      console.error("Error creating PIX key:", error);
      res.status(400).json({ message: error.message || "Failed to create PIX key" });
    }
  });

  // Update PIX key
  app.patch("/api/pix-keys/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      // Strip tenantId and bankAccountId from payload (security)
      const { tenantId: _, bankAccountId: __, ...updates } = req.body;
      
      const pixKey = await storage.updatePixKey(tenantId, id, updates);
      if (!pixKey) {
        return res.status(404).json({ message: "Chave PIX não encontrada" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "pix-keys", "updated", pixKey);
      
      res.json(pixKey);
    } catch (error: any) {
      console.error("Error updating PIX key:", error);
      res.status(400).json({ message: error.message || "Failed to update PIX key" });
    }
  });

  // Delete PIX key (soft-delete)
  app.delete("/api/pix-keys/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const success = await storage.deletePixKey(tenantId, id);
      if (!success) {
        return res.status(404).json({ message: "Chave PIX não encontrada" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "pix-keys", "deleted", { id });
      
      res.json({ message: "Chave PIX excluída com sucesso" });
    } catch (error: any) {
      console.error("Error deleting PIX key:", error);
      res.status(400).json({ message: error.message || "Failed to delete PIX key" });
    }
  });

  // AI Assistant routes (authenticated + multi-tenant)
  
  // Process entity input with AI (for customers/suppliers)
  app.post("/api/ai/process-entity", isAuthenticated, async (req, res) => {
    try {
      const { input } = req.body;
      
      if (!input || typeof input !== "string" || input.trim().length === 0) {
        return res.status(400).json({ message: "Input inválido" });
      }
      
      // Import dynamically to avoid circular dependencies
      const { processEntityInput } = await import("./ai-service");
      
      const processedData = await processEntityInput(input.trim());
      
      res.json(processedData);
    } catch (error: any) {
      console.error("Error processing entity input:", error);
      res.status(500).json({ 
        message: "Erro ao processar informações",
        error: error.message 
      });
    }
  });

  // Customers/Suppliers routes (authenticated + multi-tenant)

  // List all customers/suppliers
  app.get("/api/customers-suppliers", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const entities = await storage.listCustomersSuppliers(tenantId);
      
      // TODO: Add percentage calculation when transactions are implemented
      // For now, return entities as-is with 0% or null
      const entitiesWithStats = entities.map(entity => ({
        ...entity,
        revenuePercentage: null,
        expensePercentage: null,
      }));
      
      res.json(entitiesWithStats);
    } catch (error) {
      console.error("Error listing customers/suppliers:", error);
      res.status(500).json({ error: "Erro ao listar clientes/fornecedores" });
    }
  });

  // Get single customer/supplier by ID
  app.get("/api/customers-suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const entity = await storage.getCustomerSupplier(tenantId, id);
      if (!entity) {
        return res.status(404).json({ message: "Cliente/Fornecedor não encontrado" });
      }
      
      res.json(entity);
    } catch (error) {
      console.error("Error getting customer/supplier:", error);
      res.status(500).json({ error: "Erro ao buscar cliente/fornecedor" });
    }
  });

  // Get customer/supplier statistics
  app.get("/api/customers-suppliers/:id/stats", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const stats = await storage.getCustomerSupplierStats(tenantId, id);
      if (!stats) {
        return res.status(404).json({ message: "Cliente/Fornecedor não encontrado" });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error getting customer/supplier stats:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  // Get customer/supplier cost centers
  app.get("/api/customers-suppliers/:id/cost-centers", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const costCenters = await storage.listCostCentersByCustomerSupplier(tenantId, id);
      res.json(costCenters);
    } catch (error) {
      console.error("Error getting customer/supplier cost centers:", error);
      res.status(500).json({ error: "Erro ao buscar centros de custo" });
    }
  });

  // Create new customer/supplier
  app.post("/api/customers-suppliers", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      
      // Validate and strip extra fields using Zod (security)
      const validatedData = insertCustomerSupplierSchema.parse(req.body);
      
      const entity = await storage.createCustomerSupplier(tenantId, validatedData);
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "customers-suppliers", "created", entity);
      
      res.json(entity);
    } catch (error: any) {
      console.error("Error creating customer/supplier:", error);
      res.status(400).json({ message: error.message || "Erro ao criar cliente/fornecedor" });
    }
  });

  // Update customer/supplier
  app.patch("/api/customers-suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      // For updates, we accept partial data without the strict validation
      // The storage layer will handle the actual update
      const entity = await storage.updateCustomerSupplier(tenantId, id, req.body);
      if (!entity) {
        return res.status(404).json({ message: "Cliente/Fornecedor não encontrado ou versão desatualizada" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "customers-suppliers", "updated", entity);
      
      res.json(entity);
    } catch (error: any) {
      console.error("Error updating customer/supplier:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar cliente/fornecedor" });
    }
  });

  // Delete customer/supplier (soft-delete)
  app.delete("/api/customers-suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const success = await storage.deleteCustomerSupplier(tenantId, id);
      if (!success) {
        return res.status(404).json({ message: "Cliente/Fornecedor não encontrado" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "customers-suppliers", "deleted", { id });
      
      res.json({ message: "Cliente/Fornecedor excluído com sucesso" });
    } catch (error: any) {
      console.error("Error deleting customer/supplier:", error);
      res.status(400).json({ message: error.message || "Erro ao excluir cliente/fornecedor" });
    }
  });

  // Toggle customer/supplier active status
  app.patch("/api/customers-suppliers/:id/toggle-active", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const entity = await storage.toggleCustomerSupplierActive(tenantId, id);
      if (!entity) {
        return res.status(404).json({ message: "Cliente/Fornecedor não encontrado" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "customers-suppliers", "updated", entity);
      
      res.json(entity);
    } catch (error: any) {
      console.error("Error toggling customer/supplier:", error);
      res.status(400).json({ message: error.message || "Erro ao alterar status" });
    }
  });

  // Get cost centers associated with a customer/supplier
  app.get("/api/customers-suppliers/:id/cost-centers", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const costCenters = await storage.listCostCentersByCustomerSupplier(tenantId, id);
      res.json(costCenters);
    } catch (error: any) {
      console.error("Error listing cost centers for customer/supplier:", error);
      res.status(400).json({ message: error.message || "Erro ao listar centros de custo" });
    }
  });

  // Add cost center to customer/supplier
  app.post("/api/customers-suppliers/:id/cost-centers", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      const { costCenterId } = req.body;
      
      if (!costCenterId) {
        return res.status(400).json({ message: "costCenterId é obrigatório" });
      }
      
      await storage.addCostCenterToCustomerSupplier(tenantId, id, costCenterId);
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "customers-suppliers", "updated", { id });
      
      res.json({ message: "Centro de custo adicionado com sucesso" });
    } catch (error: any) {
      console.error("Error adding cost center to customer/supplier:", error);
      res.status(400).json({ message: error.message || "Erro ao adicionar centro de custo" });
    }
  });

  // Remove cost center from customer/supplier
  app.delete("/api/customers-suppliers/:id/cost-centers/:costCenterId", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id, costCenterId } = req.params;
      
      await storage.removeCostCenterFromCustomerSupplier(tenantId, id, costCenterId);
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "customers-suppliers", "updated", { id });
      
      res.json({ message: "Centro de custo removido com sucesso" });
    } catch (error: any) {
      console.error("Error removing cost center from customer/supplier:", error);
      res.status(400).json({ message: error.message || "Erro ao remover centro de custo" });
    }
  });

  // Update all cost centers for customer/supplier (replaces existing)
  app.put("/api/customers-suppliers/:id/cost-centers", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      const { costCenterIds } = req.body;
      
      if (!Array.isArray(costCenterIds)) {
        return res.status(400).json({ message: "costCenterIds deve ser um array" });
      }
      
      await storage.updateCustomerSupplierCostCenters(tenantId, id, costCenterIds);
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "customers-suppliers", "updated", { id });
      
      res.json({ message: "Centros de custo atualizados com sucesso" });
    } catch (error: any) {
      console.error("Error updating cost centers for customer/supplier:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar centros de custo" });
    }
  });

  // AI Report for customers/suppliers
  app.post("/api/ai-report/customers-suppliers", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt é obrigatório" });
      }

      console.log(`[AI Report] Processing report request: "${prompt}"`);

      // Use AI to generate filters from user prompt
      const { generateReportFilters } = await import("./ai-service");
      const filters = await generateReportFilters(prompt);

      console.log(`[AI Report] Generated filters:`, filters);

      // Execute query with filters
      const results = await storage.reportCustomersSuppliers(tenantId, filters);

      console.log(`[AI Report] Found ${results.length} records`);

      // Filter fields if selectedFields is provided
      let filteredData = results;
      if (filters.selectedFields && filters.selectedFields.length > 0) {
        filteredData = results.map(record => {
          const filtered: any = {};
          filters.selectedFields!.forEach(field => {
            if (field === 'type') {
              // Computed field
              if (record.isCustomer && record.isSupplier) {
                filtered.type = 'Cliente/Fornecedor';
              } else if (record.isCustomer) {
                filtered.type = 'Cliente';
              } else if (record.isSupplier) {
                filtered.type = 'Fornecedor';
              }
            } else if (field === 'status') {
              // Computed field
              filtered.status = record.isActive ? 'Ativo' : 'Inativo';
            } else if (field in record) {
              // Direct field mapping
              filtered[field] = (record as any)[field];
            }
          });
          return filtered;
        });
      }

      // Return results with metadata
      res.json({
        data: filteredData,
        metadata: {
          totalRecords: results.length,
          selectedFields: filters.selectedFields || ['code', 'name', 'type', 'document', 'city', 'state', 'status'],
          reportTitle: filters.reportTitle || 'Relatório de Clientes e Fornecedores',
          filters,
          prompt,
        }
      });
    } catch (error: any) {
      console.error("Error generating AI report:", error);
      res.status(500).json({ message: error.message || "Erro ao gerar relatório" });
    }
  });

  // Cash Registers routes (authenticated + multi-tenant + multi-company)

  // List all cash registers for a company
  app.get("/api/cash-registers", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      const registers = await storage.listCashRegisters(tenantId, companyId);
      res.json(registers);
    } catch (error) {
      console.error("Error listing cash registers:", error);
      res.status(500).json({ error: "Erro ao listar caixas" });
    }
  });

  // Get single cash register by ID
  app.get("/api/cash-registers/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      const register = await storage.getCashRegister(tenantId, companyId, id);
      if (!register) {
        return res.status(404).json({ message: "Caixa não encontrado" });
      }
      
      res.json(register);
    } catch (error) {
      console.error("Error getting cash register:", error);
      res.status(500).json({ error: "Erro ao buscar caixa" });
    }
  });

  // Create new cash register
  app.post("/api/cash-registers", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      
      // Validate and strip extra fields using Zod (security)
      const validatedData = insertCashRegisterSchema.parse(req.body);
      
      const register = await storage.createCashRegister(
        tenantId,
        validatedData.companyId,
        validatedData
      );
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "cash-registers", "created", register);
      
      res.json(register);
    } catch (error: any) {
      console.error("Error creating cash register:", error);
      res.status(400).json({ message: error.message || "Erro ao criar caixa" });
    }
  });

  // Update cash register
  app.patch("/api/cash-registers/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      // Validate partial update (omit required fields)
      const validatedData = insertCashRegisterSchema.partial().parse(req.body);
      
      const register = await storage.updateCashRegister(tenantId, companyId, id, validatedData);
      if (!register) {
        return res.status(404).json({ message: "Caixa não encontrado" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "cash-registers", "updated", register);
      
      res.json(register);
    } catch (error: any) {
      console.error("Error updating cash register:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar caixa" });
    }
  });

  // Delete cash register
  app.delete("/api/cash-registers/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      const success = await storage.deleteCashRegister(tenantId, companyId, id);
      if (!success) {
        return res.status(404).json({ message: "Caixa não encontrado" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "cash-registers", "deleted", { id });
      
      res.json({ message: "Caixa excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting cash register:", error);
      res.status(500).json({ error: "Erro ao excluir caixa" });
    }
  });

  // Toggle cash register active status
  app.patch("/api/cash-registers/:id/toggle-active", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      const register = await storage.toggleCashRegisterActive(tenantId, companyId, id);
      if (!register) {
        return res.status(404).json({ message: "Caixa não encontrado" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "cash-registers", "updated", register);
      
      res.json(register);
    } catch (error: any) {
      console.error("Error toggling cash register:", error);
      res.status(400).json({ message: error.message || "Erro ao alterar status" });
    }
  });

  // Bank Billing Configs routes (authenticated + multi-tenant + multi-company)

  // List all bank billing configs for a company
  app.get("/api/bank-billing-configs", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ message: "companyId é obrigatório" });
      }
      
      const configs = await storage.listBankBillingConfigs(tenantId, companyId);
      res.json(configs);
    } catch (error) {
      console.error("Error listing bank billing configs:", error);
      res.status(500).json({ error: "Erro ao listar configurações bancárias" });
    }
  });

  // Get single bank billing config by bank code
  app.get("/api/bank-billing-configs/:bankCode", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { bankCode } = req.params;
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ message: "companyId é obrigatório" });
      }
      
      const config = await storage.getBankBillingConfig(tenantId, companyId, bankCode);
      if (!config) {
        return res.status(404).json({ message: "Configuração bancária não encontrada" });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error getting bank billing config:", error);
      res.status(500).json({ error: "Erro ao buscar configuração bancária" });
    }
  });

  // Create or update bank billing config (upsert)
  app.post("/api/bank-billing-configs", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      
      // Validate and strip extra fields using Zod (security)
      const validatedData = insertBankBillingConfigSchema.parse(req.body);
      
      // Security: Verify that company has a bank account for this bankCode
      const bankAccounts = await storage.listBankAccounts(tenantId);
      const hasBankAccount = bankAccounts.some(
        account => 
          account.companyId === validatedData.companyId && 
          account.bankCode === validatedData.bankCode &&
          !account.deleted
      );
      
      if (!hasBankAccount) {
        return res.status(400).json({ 
          message: "Não é possível configurar boleto para um banco sem conta cadastrada. Cadastre uma conta bancária primeiro." 
        });
      }
      
      const config = await storage.upsertBankBillingConfig(tenantId, validatedData);
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "bank-billing-configs", "updated", config);
      
      res.json(config);
    } catch (error: any) {
      console.error("Error upserting bank billing config:", error);
      res.status(400).json({ message: error.message || "Erro ao salvar configuração bancária" });
    }
  });

  // Delete bank billing config (soft-delete)
  app.delete("/api/bank-billing-configs/:bankCode", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { bankCode } = req.params;
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ message: "companyId é obrigatório" });
      }
      
      const success = await storage.deleteBankBillingConfig(tenantId, companyId, bankCode);
      if (!success) {
        return res.status(404).json({ message: "Configuração bancária não encontrada" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "bank-billing-configs", "deleted", { bankCode, companyId });
      
      res.json({ message: "Configuração bancária excluída com sucesso" });
    } catch (error: any) {
      console.error("Error deleting bank billing config:", error);
      res.status(400).json({ message: error.message || "Erro ao excluir configuração bancária" });
    }
  });

  // Payment Methods routes (authenticated + multi-tenant)

  // List all payment methods (auto-seed on first access)
  app.get("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      
      // Auto-seed if no payment methods exist
      await storage.seedDefaultPaymentMethods(tenantId);
      
      const methods = await storage.listPaymentMethods(tenantId);
      res.json(methods);
    } catch (error) {
      console.error("Error listing payment methods:", error);
      res.status(500).json({ error: "Failed to list payment methods" });
    }
  });

  // Toggle payment method (activate/deactivate)
  app.patch("/api/payment-methods/:id/toggle", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      // Validate and strip extra fields using Zod (security)
      const validatedData = togglePaymentMethodSchema.parse(req.body);
      
      const method = await storage.togglePaymentMethod(tenantId, id, validatedData.isActive);
      if (!method) {
        return res.status(404).json({ message: "Forma de pagamento não encontrada" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "payment-methods", "updated", method);
      
      res.json(method);
    } catch (error: any) {
      console.error("Error toggling payment method:", error);
      res.status(400).json({ message: error.message || "Não foi possível atualizar a forma de pagamento" });
    }
  });

  // Transactions routes (authenticated + multi-tenant)

  // Backfill transaction codes for existing records (one-time migration)
  app.post("/api/transactions/backfill-codes", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId } = req.body;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }

      console.log(`[Backfill] Starting code backfill for tenant=${tenantId}, company=${companyId}`);
      
      // Get all transactions with code=0 (old records)
      const oldTransactions = await storage.listTransactions(tenantId, companyId, {});
      const needsBackfill = oldTransactions.filter(t => t.code === 0);
      
      console.log(`[Backfill] Found ${needsBackfill.length} transactions needing code assignment`);
      
      if (needsBackfill.length === 0) {
        return res.json({ message: "Nenhum lançamento precisa de código", updated: 0 });
      }
      
      // Sort by creation date to maintain chronological order
      needsBackfill.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      let nextCode = 1;
      let updatedCount = 0;
      
      for (const transaction of needsBackfill) {
        // Use raw SQL to update code without triggering full transaction logic
        await db.execute(sql`
          UPDATE transactions 
          SET code = ${nextCode}, updated_at = NOW()
          WHERE id = ${transaction.id}
            AND tenant_id = ${tenantId}
            AND company_id = ${companyId}
        `);
        
        nextCode++;
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`[Backfill] Updated ${updatedCount}/${needsBackfill.length} transactions`);
        }
      }
      
      console.log(`[Backfill] Completed! Updated ${updatedCount} transactions`);
      
      res.json({ 
        message: `Códigos atribuídos com sucesso a ${updatedCount} lançamentos`,
        updated: updatedCount 
      });
    } catch (error: any) {
      console.error("Error backfilling transaction codes:", error);
      res.status(500).json({ error: "Erro ao atribuir códigos" });
    }
  });

  // List all transactions with filters
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId, startDate, endDate, type, status, personId, costCenterId, chartAccountId, cashRegisterId, query } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }

      const filters: any = {};
      if (startDate && typeof startDate === 'string') filters.startDate = new Date(startDate);
      if (endDate && typeof endDate === 'string') filters.endDate = new Date(endDate);
      if (type && typeof type === 'string') filters.type = type as 'expense' | 'revenue';
      if (status && typeof status === 'string') filters.status = status;
      if (personId && typeof personId === 'string') filters.personId = personId;
      if (costCenterId && typeof costCenterId === 'string') filters.costCenterId = costCenterId;
      if (chartAccountId && typeof chartAccountId === 'string') filters.chartAccountId = chartAccountId;
      if (cashRegisterId && typeof cashRegisterId === 'string') filters.cashRegisterId = cashRegisterId;
      if (query && typeof query === 'string') filters.query = query;
      
      const transactions = await storage.listTransactions(tenantId, companyId, filters);
      
      // Include cost center distributions for each transaction
      const transactionsWithCostCenters = await Promise.all(
        transactions.map(async (transaction) => {
          const costCenters = await storage.getTransactionCostCenters(tenantId, transaction.id);
          return { ...transaction, costCenterDistributions: costCenters };
        })
      );
      
      res.json(transactionsWithCostCenters);
    } catch (error) {
      console.error("Error listing transactions:", error);
      res.status(500).json({ error: "Erro ao listar lançamentos" });
    }
  });

  // Get single transaction by ID
  app.get("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      const transaction = await storage.getTransaction(tenantId, companyId, id);
      if (!transaction) {
        return res.status(404).json({ message: "Lançamento não encontrado" });
      }
      
      // Include cost center distributions
      const costCenters = await storage.getTransactionCostCenters(tenantId, id);
      
      res.json({ ...transaction, costCenterDistributions: costCenters });
    } catch (error) {
      console.error("Error getting transaction:", error);
      res.status(500).json({ error: "Erro ao buscar lançamento" });
    }
  });

  // Create multiple transactions in batch (for AI assistant)
  // LIMITATION: Current storage layer doesn't support passing transaction context,
  // so this validates all upfront and creates sequentially. If mid-batch failure occurs,
  // previously created transactions remain (not fully atomic).
  // TODO: Refactor storage to accept transaction parameter for true atomicity.
  app.post("/api/transactions/batch", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const userId = (req as any).user.id;
      let { transactions, cloneConfig } = req.body;
      
      console.log(`[Batch Transaction] Request:`, { transactions: transactions?.length || 0, cloneConfig });
      
      // Process cloneConfig if present (for clone_by_code operations)
      if (cloneConfig && cloneConfig.sourceCode && cloneConfig.companyId) {
        console.log(`[Clone] Processing clone_by_code: ${cloneConfig.sourceCode}`);
        
        // Fetch original transaction by code
        const allTransactions = await storage.listTransactions(tenantId, cloneConfig.companyId);
        const sourceCodeFormatted = cloneConfig.sourceCode.toUpperCase();
        
        // Try to find by formatted code (e.g., DES001, REC045) or raw numeric code
        let originalTransaction = allTransactions.find((t: any) => {
          const formattedCode = t.type === 'revenue' ? `REC${String(t.code).padStart(3, '0')}` : `DES${String(t.code).padStart(3, '0')}`;
          return formattedCode === sourceCodeFormatted || String(t.code) === cloneConfig.sourceCode;
        });
        
        if (!originalTransaction) {
          return res.status(404).json({ message: `Transação com código ${cloneConfig.sourceCode} não encontrada` });
        }
        
        console.log(`[Clone] Found original transaction:`, originalTransaction.id);
        
        // Apply overrides from cloneConfig
        const clonedTransaction: any = {
          companyId: cloneConfig.companyId,
          type: cloneConfig.overrides?.type || originalTransaction.type,
          title: cloneConfig.overrides?.title || originalTransaction.title,
          description: cloneConfig.overrides?.description || originalTransaction.description,
          amount: cloneConfig.overrides?.amount || originalTransaction.amount,
          personId: originalTransaction.personId, // Keep original for now
          chartAccountId: originalTransaction.chartAccountId,
          costCenterId: originalTransaction.costCenterId,
          paymentMethodId: originalTransaction.paymentMethodId,
          bankAccountId: originalTransaction.bankAccountId,
          cashRegisterId: originalTransaction.cashRegisterId,
          status: originalTransaction.status,
          discount: originalTransaction.discount || "0",
          interest: originalTransaction.interest || "0",
          fees: originalTransaction.fees || "0",
          tags: originalTransaction.tags || [],
          issueDate: originalTransaction.issueDate,
          dueDate: originalTransaction.dueDate,
          paidDate: originalTransaction.paidDate,
        };
        
        // If personName override is provided, we'll need to match it to a person
        if (cloneConfig.overrides?.personName) {
          const persons = await storage.listCustomersSuppliers(tenantId);
          const matchedPerson = persons.find((p: any) => 
            p.name.toLowerCase().includes(cloneConfig.overrides.personName.toLowerCase()) ||
            cloneConfig.overrides.personName.toLowerCase().includes(p.name.toLowerCase())
          );
          
          if (matchedPerson) {
            clonedTransaction.personId = matchedPerson.id;
            console.log(`[Clone] Matched person override: ${matchedPerson.name} (${matchedPerson.id})`);
          } else {
            console.log(`[Clone] Person override "${cloneConfig.overrides.personName}" not matched, keeping original`);
          }
        }
        
        // Generate cloned transactions based on periodType and count
        const count = cloneConfig.count || 1;
        const periodType = cloneConfig.periodType || 'daily';
        
        console.log(`[Clone] Generating ${count} clones with period: ${periodType}`);
        
        transactions = [];
        const baseDate = new Date(clonedTransaction.dueDate);
        
        for (let i = 0; i < count; i++) {
          let newDate: Date;
          
          if (periodType === 'daily') {
            newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() + i);
          } else if (periodType === 'weekly') {
            newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() + (i * 7));
          } else if (periodType === 'monthly') {
            newDate = new Date(baseDate);
            newDate.setMonth(baseDate.getMonth() + i);
          } else if (periodType === 'yearly') {
            newDate = new Date(baseDate);
            newDate.setFullYear(baseDate.getFullYear() + i);
          } else {
            newDate = new Date(baseDate);
          }
          
          transactions.push({
            ...clonedTransaction,
            issueDate: newDate.toISOString(),
            dueDate: newDate.toISOString(),
          });
        }
        
        console.log(`[Clone] Generated ${transactions.length} transactions`);
      }
      
      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ message: "transactions deve ser um array não vazio" });
      }
      
      console.log(`[Batch Transaction] Creating ${transactions.length} transactions`);
      
      // Validate ALL transactions upfront - fail fast before any creation
      // This minimizes (but doesn't eliminate) risk of partial batch creation
      const validatedTransactions = transactions.map(transactionData => {
        const { costCenterDistributions, ...data } = transactionData;
        const validatedData = insertTransactionSchema.parse(data);
        return { validatedData, costCenterDistributions };
      });
      
      console.log(`[Batch Transaction] Validation successful, proceeding with creation`);
      
      const createdTransactions: any[] = [];
      
      // Create each transaction sequentially
      // KNOWN ISSUE: If creation fails mid-batch, previously created ones remain
      for (const { validatedData, costCenterDistributions } of validatedTransactions) {
        const transaction = await storage.createTransaction(
          tenantId,
          validatedData.companyId,
          validatedData,
          userId
        );
        
        // Save cost center distributions if provided
        if (costCenterDistributions && Array.isArray(costCenterDistributions) && costCenterDistributions.length > 0) {
          await storage.saveTransactionCostCenters(tenantId, transaction.id, costCenterDistributions);
        }
        
        // Fetch cost centers to include in response
        const costCenters = await storage.getTransactionCostCenters(tenantId, transaction.id);
        const responseData = { ...transaction, costCenterDistributions: costCenters };
        
        createdTransactions.push(responseData);
      }
      
      // Only broadcast after ALL transactions are successfully created
      for (const transaction of createdTransactions) {
        broadcastDataChange(tenantId, "transactions", "created", transaction);
      }
      
      console.log(`[Batch Transaction] Successfully created ${createdTransactions.length} transactions`);
      
      res.json({
        count: createdTransactions.length,
        transactions: createdTransactions,
      });
    } catch (error: any) {
      console.error("Error creating batch transactions:", error);
      res.status(400).json({ message: error.message || "Erro ao criar lançamentos em lote" });
    }
  });

  // Create new transaction
  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const userId = (req as any).user.id;
      
      // Extract cost center distributions from body (not part of insertTransactionSchema)
      const { costCenterDistributions, ...transactionData } = req.body;
      
      // Validate and strip extra fields using Zod (security)
      const validatedData = insertTransactionSchema.parse(transactionData);
      
      const transaction = await storage.createTransaction(
        tenantId,
        validatedData.companyId,
        validatedData,
        userId
      );
      
      // Save cost center distributions if provided
      if (costCenterDistributions && Array.isArray(costCenterDistributions) && costCenterDistributions.length > 0) {
        await storage.saveTransactionCostCenters(tenantId, transaction.id, costCenterDistributions);
      }
      
      // Fetch cost centers to include in response
      const costCenters = await storage.getTransactionCostCenters(tenantId, transaction.id);
      const responseData = { ...transaction, costCenterDistributions: costCenters };
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "transactions", "created", responseData);
      
      res.json(responseData);
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: error.message || "Erro ao criar lançamento" });
    }
  });

  // Update transaction
  app.patch("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { companyId } = req.query;
      
      console.log("=== PATCH /api/transactions/:id ===");
      console.log("URL:", req.url);
      console.log("Query params:", req.query);
      console.log("companyId from query:", companyId);
      console.log("companyId type:", typeof companyId);
      
      if (!companyId || typeof companyId !== 'string') {
        console.log("ERROR: companyId validation failed!");
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      // Extract cost center distributions from body (not part of insertTransactionSchema)
      const { costCenterDistributions, ...transactionData } = req.body;
      
      console.log("PATCH /api/transactions/:id - Request body:", JSON.stringify(req.body, null, 2));
      console.log("Transaction data (after extracting costCenterDistributions):", JSON.stringify(transactionData, null, 2));
      
      // Remove fields with empty strings before Zod validation
      // This prevents both Zod validation errors and foreign key constraint violations
      const fieldsToClean = [
        'personId', 'costCenterId', 'chartAccountId', 
        'bankAccountId', 'paymentMethodId', 'cashRegisterId',
        'paidAmount', 'seriesId'
      ];
      
      for (const field of fieldsToClean) {
        if (transactionData[field] === '') {
          delete transactionData[field];
        }
      }
      
      // Validate and strip extra fields using Zod (security)
      const validatedData = insertTransactionSchema.partial().parse(transactionData);
      
      const transaction = await storage.updateTransaction(
        tenantId,
        companyId,
        id,
        validatedData,
        userId
      );
      
      if (!transaction) {
        return res.status(404).json({ message: "Lançamento não encontrado" });
      }
      
      // Update cost center distributions if provided
      if (costCenterDistributions !== undefined) {
        if (Array.isArray(costCenterDistributions) && costCenterDistributions.length > 0) {
          await storage.saveTransactionCostCenters(tenantId, id, costCenterDistributions);
        } else {
          // Empty array means remove all cost centers
          await storage.deleteTransactionCostCenters(tenantId, id);
        }
      }
      
      // Fetch cost centers to include in response
      const costCenters = await storage.getTransactionCostCenters(tenantId, id);
      const responseData = { ...transaction, costCenterDistributions: costCenters };
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "transactions", "updated", responseData);
      
      res.json(responseData);
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      if (error.name === 'ZodError') {
        console.error("Zod validation errors:", JSON.stringify(error.errors, null, 2));
      }
      res.status(400).json({ message: error.message || "Erro ao atualizar lançamento" });
    }
  });

  // Delete transaction (soft delete)
  app.delete("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      const { companyId } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      const success = await storage.deleteTransaction(tenantId, companyId, id);
      if (!success) {
        return res.status(404).json({ message: "Lançamento não encontrado" });
      }
      
      // Broadcast to all clients in this tenant
      broadcastDataChange(tenantId, "transactions", "deleted", { id });
      
      res.json({ message: "Lançamento excluído com sucesso" });
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      res.status(400).json({ message: error.message || "Erro ao excluir lançamento" });
    }
  });

  // Pay/receive transaction
  app.post("/api/transactions/:id/pay", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { companyId, paidDate, paidAmount, bankAccountId, paymentMethodId, cashRegisterId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      if (!paidDate) {
        return res.status(400).json({ error: "paidDate é obrigatório" });
      }
      
      const transaction = await storage.payTransaction(
        tenantId,
        companyId,
        id,
        {
          paidDate: new Date(paidDate),
          paidAmount,
          bankAccountId,
          paymentMethodId,
          cashRegisterId,
        },
        userId
      );
      
      if (!transaction) {
        return res.status(404).json({ message: "Lançamento não encontrado" });
      }
      
      // Broadcast to all clients in this tenant (paid is an update)
      broadcastDataChange(tenantId, "transactions", "updated", transaction);
      
      res.json(transaction);
    } catch (error: any) {
      console.error("Error paying transaction:", error);
      res.status(400).json({ message: error.message || "Erro ao registrar pagamento" });
    }
  });

  // Analyze transaction command with AI
  app.post("/api/transactions/analyze-command", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { command, companyId } = req.body;

      if (!command || typeof command !== "string") {
        return res.status(400).json({ message: "Comando é obrigatório" });
      }

      if (!companyId || typeof companyId !== "string") {
        return res.status(400).json({ message: "companyId é obrigatório" });
      }

      // Import AI service
      const { analyzeTransactionCommand } = await import("./ai-service");

      // Fetch available entities for matching
      const persons = await storage.listCustomersSuppliers(tenantId);
      const accounts = await storage.listChartOfAccounts(tenantId);
      const costCenters = await storage.listCostCenters(tenantId);

      // Analyze command using AI
      const result = await analyzeTransactionCommand(
        command,
        companyId,
        persons.map(p => ({ id: p.id, name: p.name, isCustomer: p.isCustomer, isSupplier: p.isSupplier })),
        accounts.map(a => ({ id: a.id, code: a.code, name: a.name })),
        costCenters.map(c => ({ id: c.id, code: c.code.toString(), name: c.name }))
      );

      res.json(result);
    } catch (error: any) {
      console.error("Error analyzing transaction command:", error);
      res.status(500).json({ message: error.message || "Erro ao analisar comando" });
    }
  });

  // Analyze batch transaction command with AI (supports multiple dates, cloning, etc.)
  app.post("/api/transactions/analyze-batch-command", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { command, companyId } = req.body;

      if (!command || typeof command !== "string") {
        return res.status(400).json({ message: "Comando é obrigatório" });
      }

      if (!companyId || typeof companyId !== "string") {
        return res.status(400).json({ message: "companyId é obrigatório" });
      }

      // Import AI service
      const { analyzeBatchTransactionCommand } = await import("./ai-service");

      // Fetch available entities for matching
      const persons = await storage.listCustomersSuppliers(tenantId);
      const accounts = await storage.listChartOfAccounts(tenantId);
      const costCenters = await storage.listCostCenters(tenantId);

      // Analyze command using AI (batch version)
      const result = await analyzeBatchTransactionCommand(
        command,
        persons.map(p => ({ id: p.id, name: p.name, isCustomer: p.isCustomer, isSupplier: p.isSupplier })),
        accounts.map(a => ({ id: a.id, code: a.code, name: a.name })),
        costCenters.map(c => ({ id: c.id, code: c.code.toString(), name: c.name }))
      );

      // If operation is clone_by_code, fetch the original transaction and populate form data
      if (result.operation === 'clone_by_code' && result.cloneConfig?.sourceCode) {
        const cloneConfig = result.cloneConfig;
        const sourceCode = cloneConfig.sourceCode;
        
        if (!sourceCode) {
          console.log(`[Clone Analysis] Source code missing`);
          res.json(result);
          return;
        }
        
        console.log(`[Clone Analysis] Fetching original transaction: ${sourceCode}`);
        
        const allTransactions = await storage.listTransactions(tenantId, companyId);
        const sourceCodeFormatted = sourceCode.toUpperCase();
        
        // Try to find by formatted code (e.g., DES001, REC045) or raw numeric code
        const originalTransaction = allTransactions.find((t: any) => {
          const formattedCode = t.type === 'revenue' ? `REC${String(t.code).padStart(3, '0')}` : `DES${String(t.code).padStart(3, '0')}`;
          return formattedCode === sourceCodeFormatted || String(t.code) === sourceCode;
        });
        
        if (originalTransaction) {
          console.log(`[Clone Analysis] Found original transaction: ${originalTransaction.title} (${originalTransaction.id})`);
          
          // Build transaction object with original data + overrides
          const clonedData: any = {
            type: cloneConfig.overrides?.type || originalTransaction.type,
            title: cloneConfig.overrides?.title || originalTransaction.title,
            description: cloneConfig.overrides?.description || originalTransaction.description,
            amount: cloneConfig.overrides?.amount || originalTransaction.amount,
            personId: originalTransaction.personId,
            personName: originalTransaction.personId ? persons.find(p => p.id === originalTransaction.personId)?.name : '',
            chartAccountId: originalTransaction.chartAccountId,
            costCenterId: originalTransaction.costCenterId,
            paymentMethodId: originalTransaction.paymentMethodId,
            dueDate: new Date().toISOString().split('T')[0], // Default to today
          };
          
          // Apply personName override if provided
          const personNameOverride = cloneConfig.overrides?.personName;
          if (personNameOverride) {
            const matchedPerson = persons.find((p: any) => 
              p.name.toLowerCase().includes(personNameOverride.toLowerCase()) ||
              personNameOverride.toLowerCase().includes(p.name.toLowerCase())
            );
            
            if (matchedPerson) {
              clonedData.personId = matchedPerson.id;
              clonedData.personName = matchedPerson.name;
              console.log(`[Clone Analysis] Applied person override: ${matchedPerson.name}`);
            }
          }
          
          // Add the cloned transaction to the result
          result.transactions = [clonedData];
          
          console.log(`[Clone Analysis] Populated form with cloned data`);
        } else {
          console.log(`[Clone Analysis] Original transaction ${cloneConfig.sourceCode} not found`);
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error analyzing batch transaction command:", error);
      res.status(500).json({ message: error.message || "Erro ao analisar comando" });
    }
  });

  // ============================================
  // ANALYTICS ROUTES
  // ============================================

  // Get DRE (Demonstração do Resultado do Exercício)
  app.get("/api/analytics/dre", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId, month, year } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      if (!month || !year) {
        return res.status(400).json({ error: "month e year são obrigatórios" });
      }
      
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      
      // Get all transactions for the specified month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
      
      const transactions = await storage.listTransactions(tenantId, companyId);
      const chartAccounts = await storage.listChartOfAccounts(tenantId);
      
      // Filter transactions by date (using issueDate for competence)
      const monthTransactions = transactions.filter((t: any) => {
        const issueDate = new Date(t.issueDate);
        return issueDate >= startDate && issueDate <= endDate && t.status !== 'cancelled';
      });
      
      // Group by chart account and calculate totals
      const accountTotals = new Map<string, { 
        accountId: string, 
        accountName: string, 
        accountCode: string,
        accountType: string,
        total: number 
      }>();
      
      monthTransactions.forEach((t: any) => {
        if (t.chartAccountId) {
          const account = chartAccounts.find(a => a.id === t.chartAccountId);
          if (account) {
            const existing = accountTotals.get(t.chartAccountId) || {
              accountId: t.chartAccountId,
              accountName: account.name,
              accountCode: account.code,
              accountType: account.type,
              total: 0
            };
            
            // Add to total (convert string to number)
            const amount = parseFloat(t.paidAmount || t.amount || '0');
            existing.total += amount;
            accountTotals.set(t.chartAccountId, existing);
          }
        }
      });
      
      // Convert to array and separate by type
      const accountsArray = Array.from(accountTotals.values());
      const revenues = accountsArray.filter((a: any) => a.accountType === 'receita');
      const expenses = accountsArray.filter(a => a.accountType === 'despesa');
      
      const totalRevenues = revenues.reduce((sum, a) => sum + a.total, 0);
      const totalExpenses = expenses.reduce((sum, a) => sum + a.total, 0);
      const netResult = totalRevenues - totalExpenses;
      
      res.json({
        revenues,
        expenses,
        totalRevenues,
        totalExpenses,
        netResult,
      });
    } catch (error: any) {
      console.error("Error calculating DRE:", error);
      res.status(500).json({ message: error.message || "Erro ao calcular DRE" });
    }
  });

  // Get DRE with hierarchical structure and percentages
  // Legacy implementation kept for reference; route path changed to avoid collision
  app.get("/api/analytics/dre-hierarchical-legacy", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId, month, year } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      if (!month || !year) {
        return res.status(400).json({ error: "month e year são obrigatórios" });
      }
      
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
      
      const transactions = await storage.listTransactions(tenantId, companyId);
      const chartAccounts = await storage.listChartOfAccounts(tenantId);
      
      // Filter transactions by date
      const monthTransactions = transactions.filter((t: any) => {
        const issueDate = new Date(t.issueDate);
        return issueDate >= startDate && issueDate <= endDate && t.status !== 'cancelled';
      });
      
      // Group by chart account
      const accountTotals = new Map<string, number>();
      monthTransactions.forEach((t: any) => {
        if (t.chartAccountId) {
          const amount = parseFloat(t.paidAmount || t.amount || '0');
          const current = accountTotals.get(t.chartAccountId) || 0;
          accountTotals.set(t.chartAccountId, current + amount);
        }
      });
      
      // Build hierarchical structure
      const buildHierarchy = (parentId: string | null, type: string): any[] => {
        const accounts = chartAccounts
          .filter((a: any) => a.type === type && a.parentId === parentId && !a.deleted)
          .sort((a: any, b: any) => a.code.localeCompare(b.code));
        
        return accounts.map((account: any) => {
          const children: any[] = buildHierarchy(account.id, type);
          const directValue: number = accountTotals.get(account.id) || 0;
          const childrenValue: number = children.reduce((sum: number, child: any) => sum + child.total, 0);
          const total: number = directValue + childrenValue;
          
          return {
            id: account.id,
            code: account.code,
            name: account.name,
            depth: account.depth,
            total,
            children: children.length > 0 ? children : undefined,
            hasChildren: children.length > 0,
          };
        });
      };
      
      const revenues = buildHierarchy(null, 'receita');
      const expenses = buildHierarchy(null, 'despesa');
      
      const totalRevenues = revenues.reduce((sum: number, a: any) => sum + a.total, 0);
      const totalExpenses = expenses.reduce((sum: number, a: any) => sum + a.total, 0);
      const netResult = totalRevenues - totalExpenses;
      
      // Add percentages to all nodes
      const addPercentages = (nodes: any[], parentTotal: number, rootTotal: number): any[] => {
        return nodes.map((node: any) => {
          const percentOfParent = parentTotal > 0 ? (node.total / parentTotal) * 100 : 0;
          const percentOfRoot = rootTotal > 0 ? (node.total / rootTotal) * 100 : 0;
          
          return {
            ...node,
            percentOfParent,
            percentOfRoot,
            children: node.children ? addPercentages(node.children, node.total, rootTotal) : undefined,
          };
        });
      };
      
      const revenuesWithPercent = addPercentages(revenues, totalRevenues, totalRevenues);
      const expensesWithPercent = addPercentages(expenses, totalExpenses, totalExpenses);
      
      res.json({
        revenues: revenuesWithPercent,
        expenses: expensesWithPercent,
        totalRevenues,
        totalExpenses,
        netResult,
      });
    } catch (error: any) {
      console.error("Error calculating hierarchical DRE:", error);
      res.status(500).json({ message: error.message || "Erro ao calcular DRE hierárquico" });
    }
  });

  // Get yearly evolution (last 12 months)
  app.get("/api/analytics/yearly-evolution", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId, year } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      if (!year) {
        return res.status(400).json({ error: "year é obrigatório" });
      }
      
      const yearNum = parseInt(year as string);
      const transactions = await storage.listTransactions(tenantId, companyId);
      
      // Calculate for all 12 months
      const monthlyData = [];
      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(yearNum, month - 1, 1);
        const endDate = new Date(yearNum, month, 0, 23, 59, 59);
        
        const monthTransactions = transactions.filter((t: any) => {
          const issueDate = new Date(t.issueDate);
          return issueDate >= startDate && issueDate <= endDate && t.status !== 'cancelled';
        });
        
        const revenues = monthTransactions
          .filter((t: any) => t.type === 'revenue')
          .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
        
        const expenses = monthTransactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
        
        const profit = revenues - expenses;
        
        monthlyData.push({
          month,
          monthName: new Date(yearNum, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }),
          revenues,
          expenses,
          profit,
        });
      }
      
      res.json({ data: monthlyData, year: yearNum });
    } catch (error: any) {
      console.error("Error calculating yearly evolution:", error);
      res.status(500).json({ message: error.message || "Erro ao calcular evolução anual" });
    }
  });

  // Get financial indicators
  app.get("/api/analytics/indicators", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId, month, year } = req.query;
      
      if (!companyId || typeof companyId !== 'string') {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      if (!month || !year) {
        return res.status(400).json({ error: "month e year são obrigatórios" });
      }
      
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      
      // Get current month data
      const currentStart = new Date(yearNum, monthNum - 1, 1);
      const currentEnd = new Date(yearNum, monthNum, 0, 23, 59, 59);
      
      // Get previous month data
      const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
      const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
      const prevStart = new Date(prevYear, prevMonth - 1, 1);
      const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59);
      
      const transactions = await storage.listTransactions(tenantId, companyId);
      
      // Filter current month
      const currentTransactions = transactions.filter((t: any) => {
        const issueDate = new Date(t.issueDate);
        return issueDate >= currentStart && issueDate <= currentEnd && t.status !== 'cancelled';
      });
      
      // Filter previous month
      const prevTransactions = transactions.filter((t: any) => {
        const issueDate = new Date(t.issueDate);
        return issueDate >= prevStart && issueDate <= prevEnd && t.status !== 'cancelled';
      });
      
      // Calculate current month metrics
      const currentRevenues = currentTransactions
        .filter((t: any) => t.type === 'revenue')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const currentExpenses = currentTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const currentProfit = currentRevenues - currentExpenses;
      
      // Calculate previous month metrics
      const prevRevenues = prevTransactions
        .filter((t: any) => t.type === 'revenue')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const prevExpenses = prevTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const prevProfit = prevRevenues - prevExpenses;
      
      // Calculate growth percentages
      const revenueGrowth = prevRevenues > 0 ? ((currentRevenues - prevRevenues) / prevRevenues) * 100 : 0;
      const expenseGrowth = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0;
      const profitGrowth = prevProfit > 0 ? ((currentProfit - prevProfit) / prevProfit) * 100 : 0;
      
      // Calculate margins
      const grossMargin = currentRevenues > 0 ? ((currentRevenues - currentExpenses) / currentRevenues) * 100 : 0;
      const netMargin = currentRevenues > 0 ? (currentProfit / currentRevenues) * 100 : 0;
      const roi = currentExpenses > 0 ? (currentProfit / currentExpenses) * 100 : 0;
      
      res.json({
        current: {
          revenues: currentRevenues,
          expenses: currentExpenses,
          profit: currentProfit,
        },
        previous: {
          revenues: prevRevenues,
          expenses: prevExpenses,
          profit: prevProfit,
        },
        growth: {
          revenues: revenueGrowth,
          expenses: expenseGrowth,
          profit: profitGrowth,
        },
        indicators: {
          grossMargin,
          netMargin,
          roi,
        },
      });
    } catch (error: any) {
      console.error("Error calculating indicators:", error);
      res.status(500).json({ message: error.message || "Erro ao calcular indicadores" });
    }
  });

  // Get hierarchical DRE structure
  app.get("/api/analytics/dre-hierarchical", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId, month, year, regime = 'caixa' } = req.query;
      
      if (!companyId) {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      const useCaixa = regime === 'caixa';
      
      // Get month boundaries
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
      
      // Fetch data
      const transactions = await storage.listTransactions(tenantId, companyId as string);
      const chartAccounts = await storage.listChartOfAccounts(tenantId);
      
      // Filter transactions for the month by regime
      // - caixa: use paidDate (only transactions actually paid/received in the period)
      // - competencia: use issueDate (competence date)
      const monthTransactions = transactions.filter((t: any) => {
        const baseDate = useCaixa
          ? (t.paidDate ? new Date(t.paidDate) : null)
          : (t.issueDate ? new Date(t.issueDate) : null);
        if (!baseDate) return false;
        return baseDate >= startDate && baseDate <= endDate && t.status !== 'cancelled';
      });
      
      // Build SEPARATE account totals maps for revenues and expenses
      // This handles cases where revenue transactions are in expense accounts (or vice-versa)
      const revenueAccountTotals = new Map<string, number>();
      const expenseAccountTotals = new Map<string, number>();
      
      monthTransactions.forEach((t: any) => {
        if (t.chartAccountId) {
          // Use paidAmount for caixa, amount for competência
          const amount = parseFloat(useCaixa ? (t.paidAmount || t.amount || '0') : (t.amount || '0'));
          
          if (t.type === 'revenue') {
            revenueAccountTotals.set(
              t.chartAccountId,
              (revenueAccountTotals.get(t.chartAccountId) || 0) + amount
            );
          } else if (t.type === 'expense') {
            expenseAccountTotals.set(
              t.chartAccountId,
              (expenseAccountTotals.get(t.chartAccountId) || 0) + amount
            );
          }
        }
      });
      
      // Helper to build hierarchy recursively
      interface AccountNode {
        id: string;
        code: string;
        name: string;
        depth: number;
        total: number;
        percentOfParent: number;
        percentOfRoot: number;
        hasChildren: boolean;
        children?: AccountNode[];
      }
      
      const buildHierarchy = (
        accounts: any[],
        parentId: string | null,
        depth: number,
        rootTotal: number,
        accountTotalsMap: Map<string, number>
      ): AccountNode[] => {
        const children = accounts.filter(acc => acc.parentId === parentId);
        
        return children.map(account => {
          // Get direct transaction total for this account
          const directTotal = accountTotalsMap.get(account.id) || 0;
          
          // Recursively get children
          const childrenNodes = buildHierarchy(accounts, account.id, depth + 1, rootTotal, accountTotalsMap);
          
          // Calculate total: direct + all children
          const childrenTotal = childrenNodes.reduce((sum, child) => sum + child.total, 0);
          const total = directTotal + childrenTotal;
          
          // Calculate percentages
          const percentOfRoot = rootTotal > 0 ? (total / rootTotal) * 100 : 0;
          
          const node: AccountNode = {
            id: account.id,
            code: account.code,
            name: account.name,
            depth,
            total,
            percentOfParent: 100, // Will be calculated by parent
            percentOfRoot,
            hasChildren: childrenNodes.length > 0,
          };
          
          if (childrenNodes.length > 0) {
            // Calculate each child's percent of this parent
            childrenNodes.forEach(child => {
              child.percentOfParent = total > 0 ? (child.total / total) * 100 : 0;
            });
            node.children = childrenNodes;
          }
          
          return node;
        });
      };
      
      // Calculate totals based on TRANSACTION type (handles mismatched account types)
      const totalRevenues = monthTransactions
        .filter((t: any) => t.type === 'revenue')
        .reduce((sum: number, t: any) => sum + parseFloat(useCaixa ? (t.paidAmount || t.amount || '0') : (t.amount || '0')), 0);
      
      const totalExpenses = monthTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(useCaixa ? (t.paidAmount || t.amount || '0') : (t.amount || '0')), 0);
      
      // Separate accounts by type for hierarchy structure
      const revenueAccounts = chartAccounts.filter((a: any) => a.type === 'receita');
      const expenseAccounts = chartAccounts.filter((a: any) => a.type === 'despesa');
      
      // Build hierarchies with correct transaction maps
      const revenues = buildHierarchy(revenueAccounts, null, 0, totalRevenues, revenueAccountTotals);
      const expenses = buildHierarchy(expenseAccounts, null, 0, totalExpenses, expenseAccountTotals);
      
      res.json({
        revenues,
        expenses,
        totalRevenues,
        totalExpenses,
        netResult: totalRevenues - totalExpenses,
      });
    } catch (error: any) {
      console.error("Error getting hierarchical DRE:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar DRE hierárquico" });
    }
  });

      // Get yearly evolution (12 months)
      app.get("/api/analytics/yearly-evolution", isAuthenticated, async (req, res) => {
        try {
          const tenantId = getTenantId((req as any).user);
          const { companyId, year, regime = 'caixa' } = req.query;
      
      if (!companyId) {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      const yearNum = parseInt(year as string);
      const useCaixa = regime === 'caixa';
      
      // Fetch all transactions for the year
      const transactions = await storage.listTransactions(tenantId, companyId as string);
      
      // Build monthly data
      const monthlyData = [];
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      
      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(yearNum, month - 1, 1);
        const endDate = new Date(yearNum, month, 0, 23, 59, 59);
        
        const monthTransactions = transactions.filter((t: any) => {
          const baseDate = useCaixa
            ? (t.paidDate ? new Date(t.paidDate) : null)
            : (t.issueDate ? new Date(t.issueDate) : null);
          if (!baseDate) return false;
          return baseDate >= startDate && baseDate <= endDate && t.status !== 'cancelled';
        });
        
        const revenues = monthTransactions
          .filter((t: any) => t.type === 'revenue')
          .reduce((sum: number, t: any) => sum + parseFloat(useCaixa ? (t.paidAmount || t.amount || '0') : (t.amount || '0')), 0);
        
        const expenses = monthTransactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + parseFloat(useCaixa ? (t.paidAmount || t.amount || '0') : (t.amount || '0')), 0);
        
        monthlyData.push({
          month,
          monthName: monthNames[month - 1],
          revenues,
          expenses,
          profit: revenues - expenses,
        });
      }
      
      res.json({ data: monthlyData });
    } catch (error: any) {
      console.error("Error getting yearly evolution:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar evolução anual" });
    }
  });

  // Generate AI insights - Professional Consultative Report
  app.post("/api/analytics/ai-insights", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { companyId, month, year } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ error: "companyId é obrigatório" });
      }
      
      if (!month || !year) {
        return res.status(400).json({ error: "month e year são obrigatórios" });
      }
      
      // Get company info for report
      const companies = await storage.listCompanies(tenantId);
      const company = companies.find(c => c.id === companyId);
      const companyName = company?.tradeName || company?.legalName || "Empresa";
      
      // Get DRE and indicators data
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      // Get current month data
      const currentStart = new Date(yearNum, monthNum - 1, 1);
      const currentEnd = new Date(yearNum, monthNum, 0, 23, 59, 59);
      
      // Get previous month data for comparison
      const prevMonthNum = monthNum === 1 ? 12 : monthNum - 1;
      const prevYearNum = monthNum === 1 ? yearNum - 1 : yearNum;
      const prevStart = new Date(prevYearNum, prevMonthNum - 1, 1);
      const prevEnd = new Date(prevYearNum, prevMonthNum, 0, 23, 59, 59);
      
      // Get same month last year for YoY comparison
      const lastYearStart = new Date(yearNum - 1, monthNum - 1, 1);
      const lastYearEnd = new Date(yearNum - 1, monthNum, 0, 23, 59, 59);
      
      const transactions = await storage.listTransactions(tenantId, companyId);
      const chartAccounts = await storage.listChartOfAccounts(tenantId);
      
      // Filter transactions for each period
      const monthTransactions = transactions.filter((t: any) => {
        const issueDate = new Date(t.issueDate);
        return issueDate >= currentStart && issueDate <= currentEnd && t.status !== 'cancelled';
      });
      
      const prevMonthTransactions = transactions.filter((t: any) => {
        const issueDate = new Date(t.issueDate);
        return issueDate >= prevStart && issueDate <= prevEnd && t.status !== 'cancelled';
      });
      
      const lastYearTransactions = transactions.filter((t: any) => {
        const issueDate = new Date(t.issueDate);
        return issueDate >= lastYearStart && issueDate <= lastYearEnd && t.status !== 'cancelled';
      });
      
      // Calculate metrics for current month
      const revenues = monthTransactions
        .filter((t: any) => t.type === 'revenue')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const expenses = monthTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const profit = revenues - expenses;
      const margin = revenues > 0 ? (profit / revenues) * 100 : 0;
      
      // Calculate metrics for previous month
      const prevRevenues = prevMonthTransactions
        .filter((t: any) => t.type === 'revenue')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const prevExpenses = prevMonthTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const prevProfit = prevRevenues - prevExpenses;
      
      // Calculate metrics for last year same month
      const lastYearRevenues = lastYearTransactions
        .filter((t: any) => t.type === 'revenue')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const lastYearExpenses = lastYearTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(t.paidAmount || t.amount || '0'), 0);
      
      const lastYearProfit = lastYearRevenues - lastYearExpenses;
      
      // Calculate growth rates
      const revenueGrowthMoM = prevRevenues > 0 ? ((revenues - prevRevenues) / prevRevenues) * 100 : 0;
      const revenueGrowthYoY = lastYearRevenues > 0 ? ((revenues - lastYearRevenues) / lastYearRevenues) * 100 : 0;
      const expenseGrowthMoM = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;
      
      // Group by chart account
      const accountTotals = new Map<string, { name: string, total: number, type: string }>();
      monthTransactions.forEach((t: any) => {
        if (t.chartAccountId) {
          const account = chartAccounts.find(a => a.id === t.chartAccountId);
          if (account) {
            const existing = accountTotals.get(t.chartAccountId) || {
              name: account.name,
              total: 0,
              type: account.type
            };
            existing.total += parseFloat(t.paidAmount || t.amount || '0');
            accountTotals.set(t.chartAccountId, existing);
          }
        }
      });
      
      // Get top revenue and expense accounts
      const accountsArray = Array.from(accountTotals.values());
      const topRevenues = accountsArray
        .filter((a: any) => a.type === 'receita')
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      
      const topExpenses = accountsArray
        .filter(a => a.type === 'despesa')
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      
      // Calculate expense ratios
      const expenseToRevenueRatio = revenues > 0 ? (expenses / revenues) * 100 : 0;
      
      // Month name
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const monthName = monthNames[monthNum - 1];
      const prevMonthName = monthNames[prevMonthNum - 1];
      
      // Generate comprehensive AI analysis
      const prompt = `Você é um consultor financeiro sênior. Analise os dados financeiros abaixo e crie um relatório consultivo profissional e completo em formato JSON com texto analítico.

**CONTEXTO DA EMPRESA:**
Empresa: ${companyName}
Período analisado: ${monthName}/${yearNum}

**DADOS FINANCEIROS DO PERÍODO:**

Mês Atual (${monthName}/${yearNum}):
- Receitas: R$ ${revenues.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
- Despesas: R$ ${expenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
- Resultado: R$ ${profit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
- Margem Líquida: ${margin.toFixed(1)}%
- Despesas/Receita: ${expenseToRevenueRatio.toFixed(1)}%

Comparação com Mês Anterior (${prevMonthName}/${prevYearNum}):
- Receitas anterior: R$ ${prevRevenues.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
- Variação MoM: ${revenueGrowthMoM > 0 ? '+' : ''}${revenueGrowthMoM.toFixed(1)}%
- Despesas anterior: R$ ${prevExpenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
- Variação MoM: ${expenseGrowthMoM > 0 ? '+' : ''}${expenseGrowthMoM.toFixed(1)}%
- Resultado anterior: R$ ${prevProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}

Comparação Anual (${monthName}/${yearNum - 1}):
- Receitas ano anterior: R$ ${lastYearRevenues.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
- Variação YoY: ${revenueGrowthYoY > 0 ? '+' : ''}${revenueGrowthYoY.toFixed(1)}%
- Resultado ano anterior: R$ ${lastYearProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}

Principais Fontes de Receita:
${topRevenues.map((a, i) => `${i+1}. ${a.name}: R$ ${a.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${revenues > 0 ? ((a.total/revenues)*100).toFixed(1) : 0}%)`).join('\n')}

Principais Despesas:
${topExpenses.map((a, i) => `${i+1}. ${a.name}: R$ ${a.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${revenues > 0 ? ((a.total/revenues)*100).toFixed(1) : 0}% da receita)`).join('\n')}

**INSTRUÇÕES PARA O RELATÓRIO:**

Retorne um JSON com a seguinte estrutura (OBRIGATÓRIO usar esta estrutura exata):

{
  "executiveSummary": "Texto de 2-4 parágrafos resumindo a situação geral da empresa no período, destacando os principais resultados e tendências observadas. Escreva como um consultor experiente analisando a saúde financeira do negócio.",
  
  "revenueAnalysis": "Texto de 2-3 parágrafos analisando as receitas: evolução, principais fontes, tendências, sazonalidade e pontos de atenção.",
  
  "expenseAnalysis": "Texto de 2-3 parágrafos analisando as despesas: evolução, principais categorias, eficiência operacional, despesas atípicas e oportunidades de otimização.",
  
  "indicators": "Texto de 1-2 parágrafos apresentando e interpretando os principais indicadores financeiros calculados (margem líquida, despesas/receita, etc).",
  
  "trends": "Texto de 1-2 parágrafos identificando tendências observadas nos últimos meses e comparação anual.",
  
  "alerts": "Texto de 1-2 parágrafos destacando alertas, riscos e pontos críticos que merecem atenção imediata.",
  
  "recommendations": "Texto de 2-3 parágrafos com recomendações estratégicas práticas e acionáveis para melhorar a performance financeira.",
  
  "insights": [
    {
      "type": "warning" | "success" | "info" | "tip",
      "title": "Título curto (max 60 caracteres)",
      "description": "Descrição detalhada (max 250 caracteres)"
    }
  ]
}

**DIRETRIZES DE ESCRITA:**
- Use linguagem profissional mas acessível
- Seja específico com números e percentuais
- Compare sempre com períodos anteriores
- Identifique causas e efeitos
- Sugira ações concretas
- Mantenha tom consultivo e construtivo
- Use parágrafos bem estruturados
- Crie pelo menos 5-8 insights no array final`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Você é um consultor financeiro sênior especializado em análise de demonstrativos financeiros. Escreva relatórios consultivos completos e profissionais em português do Brasil, como se estivesse assessorando o CEO da empresa."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content || "{}";
      
      // Parse AI response
      let analysisData: any = {};
      try {
        analysisData = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        analysisData = {
          executiveSummary: "Não foi possível gerar a análise completa. Por favor, tente novamente.",
          insights: [{
            type: "info",
            title: "Análise indisponível",
            description: "Ocorreu um erro ao processar os dados. Tente novamente em alguns instantes."
          }]
        };
      }
      
      // Ensure insights array exists
      if (!analysisData.insights || !Array.isArray(analysisData.insights)) {
        analysisData.insights = [];
      }
      
      // Add metadata for PDF generation
      analysisData.metadata = {
        companyName,
        period: `${monthName}/${yearNum}`,
        generatedAt: new Date().toISOString(),
        revenues,
        expenses,
        profit,
        margin,
        revenueGrowthMoM,
        revenueGrowthYoY
      };
      
      res.json(analysisData);
    } catch (error: any) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: error.message || "Erro ao gerar insights" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
