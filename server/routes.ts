// Local authentication system
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCompanySchema, 
  insertCompanyMemberSchema,
  insertCostCenterSchema,
  insertChartAccountSchema,
  loginSchema, 
  signupSchema,
  createCollaboratorSchema,
  acceptInviteSchema,
} from "@shared/schema";
import { setupAuth, isAuthenticated, hashPassword } from "./localAuth";
import { initializeEmailService, sendInviteEmail } from "./emailService";
import { getTenantId } from "./tenantUtils";
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
      const costCenterData = insertCostCenterSchema.omit({ code: true }).parse(req.body);
      const costCenter = await storage.createCostCenter(tenantId, costCenterData);
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
      
      // Strip tenantId, code, parentId from payload (security)
      const { tenantId: _, code: __, parentId: ___, ...updates } = req.body;
      
      const account = await storage.updateChartAccount(tenantId, id, updates);
      if (!account) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }
      
      res.json(account);
    } catch (error: any) {
      console.error("Error updating chart account:", error);
      res.status(400).json({ message: error.message || "Failed to update account" });
    }
  });

  // Delete account (soft-delete)
  app.delete("/api/chart-of-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const tenantId = getTenantId((req as any).user);
      const { id } = req.params;
      
      const success = await storage.deleteChartAccount(tenantId, id);
      if (!success) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }
      
      res.json({ message: "Conta excluída com sucesso" });
    } catch (error: any) {
      console.error("Error deleting chart account:", error);
      res.status(400).json({ message: error.message || "Failed to delete account" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
