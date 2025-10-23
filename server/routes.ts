// Local authentication system
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, loginSchema, signupSchema } from "@shared/schema";
import { setupAuth, isAuthenticated, hashPassword } from "./localAuth";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - must be first
  await setupAuth(app);

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

      // Create user
      const newUser = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
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

  // Protected companies routes
  app.get("/api/companies", isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.listCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error listing companies:", error);
      res.status(500).json({ error: "Failed to list companies" });
    }
  });

  app.get("/api/companies/:id", isAuthenticated, async (req, res) => {
    try {
      const company = await storage.getCompanyById(req.params.id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error getting company:", error);
      res.status(500).json({ error: "Failed to get company" });
    }
  });

  app.patch("/api/companies/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.params.id, updates);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(400).json({ error: "Invalid company data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
