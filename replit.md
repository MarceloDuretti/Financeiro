# FinControl - Financial Management System

## Overview

FinControl is a comprehensive financial management platform designed for individuals and businesses (including MEI). It features a modern, Apple-inspired minimalist landing page and a full-featured dashboard for managing financial transactions, accounts, categories, and generating reports. The application is a full-stack TypeScript solution utilizing a React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

**Key Architectural Features:**
- **True Multi-Tenant Architecture (Big Data)**: Single PostgreSQL database serves multiple isolated clients with row-level tenant isolation
- **Hierarchical User System**: Admin/collaborator roles with email invitations and granular company access control
- **Complete Data Isolation**: Each admin tenant can only see and manage their own data - zero cross-tenant data leakage
- **Performance Optimized**: Composite indexes on (tenantId, id) for fast tenant-scoped queries

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI and shadcn/ui for components, Tailwind CSS for styling, and Vite as the build tool.

**Design System:** Apple-inspired minimalist aesthetic, mobile-first, custom color palette (blue primary, neutral grays), SF Pro Display typography, responsive breakpoints (mobile, tablet, desktop).

**Application Structure:**
- **Landing Page:** Public marketing site.
- **Dashboard:** Authenticated application with sidebar navigation and modular feature sets.
- **Routing:** Public routes for landing and authentication, protected routes for the dashboard.
- **Authentication:** Custom local email/password authentication using Passport Local Strategy, session-based (PostgreSQL), with integrated Apple-inspired login, signup, and password recovery pages. Auto-login on signup.

**Key Features:**
- Modular component architecture.
- Chart visualizations with Recharts (LineChart, PieChart) and custom heatmap tables.
- Form handling with React Hook Form and Zod validation.
- Responsive sidebar layout with conditional menu states.
- **Custom Local Authentication:** Email/password with bcryptjs, user profile display, logout.
- **Dashboard Design:** KPI cards with gradient backgrounds and sparklines, clean financial LineChart, heatmap table for department performance.
- **Minha Empresa (My Company) Page:** 
  - Master-detail interface for managing multiple companies
  - Full CRUD operations: Create (Dialog with React Hook Form + Zod), Read (list + details), Update (inline edit mode), Delete (AlertDialog confirmation)
  - Multi-tenant isolation with tenantId enforcement
  - Responsive layout with TanStack Query for data fetching
  - localStorage persistence for selected company
  - Conditional sidebar state: menus disabled when no companies exist, enabled when at least one company is created
  - Complete data-testid coverage for automated testing
- **Usuarios (Users) Page:** Hierarchical user management (admin/collaborator), CRUD for collaborators, email invitations, granular company access. Table-based UI with status badges and action buttons.
- **Accept Invite Page:** Public route for collaborators to set passwords and activate accounts.

### Backend Architecture

**Technology Stack:** Node.js with TypeScript, Express.js, Drizzle ORM, esbuild for production, tsx for development.

**API Design:** RESTful API (`/api` prefix).
- **Authentication:**
    - `POST /api/auth/signup`: Create user (admin role, auto-login).
    - `POST /api/auth/login`: Login (Passport Local Strategy).
    - `POST /api/auth/logout`: Logout.
    - `GET /api/auth/user`: Get current user.
    - Session-based authentication with PostgreSQL storage, bcryptjs for password hashing, `isAuthenticated` and `isAdmin` middleware.
- **Company Management:**
    - `GET /api/companies`: List companies (tenant-scoped).
    - `GET /api/companies/:id`: Get company details (tenant-scoped).
    - `POST /api/companies`: Create company (auto-injects tenantId).
    - `PATCH /api/companies/:id`: Update company (tenant-scoped, strips tenantId from payload).
    - `DELETE /api/companies/:id`: Delete company (tenant-scoped).
    - All routes enforce multi-tenant isolation via `getTenantId()`.
- **Collaborator Management:**
    - `GET /api/collaborators`: List collaborators (admin only).
    - `POST /api/collaborators`: Create and invite collaborator (admin only).
    - `PATCH /api/collaborators/:id/status`: Activate/deactivate (admin only).
    - `POST /api/collaborators/:id/resend-invite`: Resend invite (admin only).
    - `POST /api/accept-invite`: Collaborator accepts invite (public).
    - Email invites via Nodemailer, time-limited `nanoid` tokens.
- Request logging middleware.

**Storage Layer:** PostgreSQL-backed via Drizzle ORM with an `IStorage` abstraction implementing **multi-tenant isolation**. All company and user-company operations require `tenantId` parameter to ensure data is scoped to the authenticated user's tenant. Includes methods for user management (create, update, get by email/ID, list collaborators), company management (list, get, create, update, delete - all with tenantId), and user-company assignments (all with tenantId).

**Multi-Tenant Architecture (October 23, 2025):**
- **Tenant Model**: Row-level multi-tenancy where each admin is a separate tenant
- **Isolation Method**: `tenantId` column added to all business data tables (companies, user_companies)
- **Security Helper**: `getTenantId(user)` extracts tenantId from authenticated user (admin uses own ID, collaborator inherits adminId)
- **API Layer**: All routes automatically inject tenantId via `getTenantId()` - never accepts tenantId from client
- **Storage Layer**: All methods enforce tenantId filtering using Drizzle ORM `and()` conditions
- **Performance**: Composite indexes on `(tenantId, id)` and `(tenantId, code)` for optimized queries
- **Security**: PATCH routes explicitly strip tenantId from payloads to prevent tenant hijacking

**Data Storage Solutions:**
- **Database:** Neon Serverless PostgreSQL, Drizzle ORM. Migrations via Drizzle Kit.
- **Schema:** Shared between client/server with multi-tenant isolation.
    - `sessions` table: PostgreSQL-backed session storage (global, no tenant).
    - `users` table: User authentication, profile, roles ("admin", "collaborator"), status, invite tokens, hierarchical `adminId`.
    - `companies` table: Multi-company data with **tenantId** for isolation (3 seed records for bootstrap admin).
    - `user_companies` table: Many-to-many relationship with **tenantId** for isolation.
    
**Bootstrap Admin (Seed Data):**
- ID: `00000000-0000-0000-0000-000000000001`
- Email: `admin@fincontrol.com.br`
- Password: `demo123`
- Owns 3 seed companies: FinControl Matriz (001), FinControl Filial RJ (002), FinControl Labs (003)

## External Dependencies

**UI Component Library:**
- Radix UI (primitives)
- shadcn/ui (styled components)
- Lucide React (icons)

**Data Visualization:**
- Recharts (charts)

**Form Management:**
- React Hook Form
- @hookform/resolvers
- Zod (schema validation)

**Database & Sessions:**
- @neondatabase/serverless (PostgreSQL driver)
- connect-pg-simple (PostgreSQL session store)
- Drizzle ORM

**Authentication & Email:**
- passport (authentication middleware)
- passport-local (local strategy)
- bcryptjs (password hashing)
- nodemailer (email sending, Gmail SMTP)

**Utilities:**
- date-fns
- clsx & tailwind-merge
- class-variance-authority
- nanoid