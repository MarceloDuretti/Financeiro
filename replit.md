# FinControl - Financial Management System

## Overview

FinControl is a comprehensive financial management platform for individuals and businesses (including MEI). It features a modern, Apple-inspired minimalist landing page and a full-featured dashboard for managing financial transactions, accounts, categories, and generating reports. The application is a full-stack TypeScript solution utilizing a React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

Key capabilities include:
- True Multi-Tenant Architecture with row-level tenant isolation.
- Hierarchical User System with admin/collaborator roles and granular company access control.
- Complete Data Isolation ensuring no cross-tenant data leakage.
- Performance Optimized with composite indexes for fast tenant-scoped queries.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI and shadcn/ui for components, Tailwind CSS for styling, and Vite as the build tool.

**Design System:** Apple-inspired minimalist aesthetic, mobile-first, custom color palette (blue primary, neutral grays), SF Pro Display typography, responsive breakpoints.

**Application Structure:** Includes a public landing page and an authenticated dashboard with modular feature sets. Custom local email/password authentication (Passport Local Strategy) is implemented with session-based storage.

**Key Features:**
- Modular component architecture.
- Chart visualizations (Recharts) and custom heatmap tables.
- Form handling with React Hook Form and Zod validation.
- Responsive sidebar layout.
- **Custom Local Authentication:** Email/password with bcryptjs, user profile, logout.
- **Dashboard Design:** KPI cards, financial LineChart, heatmap table.
- **Minha Empresa (My Company) Page:** Master-detail interface for managing multiple companies with full CRUD, multi-tenant isolation, and localStorage persistence for selected company. Includes an Apple-style tab interface for company details and team member management.
- **Team Members Management (Equipe Tab):** Full CRUD for team members within each company, card-based layout, and soft-delete implementation.
- **Usuarios (Users) Page:** Hierarchical user management (admin/collaborator), CRUD for collaborators, and email invitations.
- **Accept Invite Page:** Public route for collaborators to activate accounts.
- **Categorias (Categories) Page:** Educational section, full CRUD for categories (Revenue/Expense), custom color selection, and real-time stats.
- **Plano de Contas (Chart of Accounts) Page:** 
  - **Auto-Seed on First Access:** When accessing for the first time (empty state), automatically creates 5 default root accounts: Receitas (1), Despesas (2), Ativo (3), Passivo (4), Patrimônio Líquido (5). Provides immediate professional structure for users without accounting knowledge.
  - **Modern VS Code-Inspired UI:** 
    - Connector lines (vertical and horizontal) showing parent-child relationships
    - Progressive indentation (32px per level) for strong visual hierarchy
    - Hierarchical typography (root: semibold, level 1: medium, level 2+: normal)
    - Hover-only action buttons (add, edit, delete) for cleaner interface
    - Larger colorful icons (h-5 w-5) with type-based colors (green for Receita, red for Despesa, blue for Ativo, amber for Passivo, violet for Patrimônio Líquido)
    - Code badges with monospace font
    - Smart spacing (more between root groups, less within groups)
  - Hierarchical tree structure (max 5 levels) with auto-generated codes (1, 1.1, 1.1.1) using advisory locks
  - Materialized path pattern for O(1) queries, full CRUD operations, expandable tree UI
  - Account types: Receita, Despesa, Ativo, Passivo, Patrimônio Líquido

### Backend Architecture

**Technology Stack:** Node.js with TypeScript, Express.js, Drizzle ORM, esbuild for production, tsx for development.

**API Design:** RESTful API with `/api` prefix.
- **Authentication:** Signup, login, logout, get current user, using Passport Local Strategy with session-based authentication.
- **Management Endpoints:**
    - `companies`: CRUD operations with multi-tenant isolation.
    - `collaborators`: List, create, invite, activate/deactivate, resend invite, and accept invite (public).
    - `company members`: List, create, update, soft-delete for members within a specific company, with multi-tenant and company-scoped isolation.
    - `categories`: CRUD operations with tenant-scoped isolation.
    - `chart-of-accounts`: CRUD operations for hierarchical accounts with tenant-scoped isolation, auto-code generation, delete validation. **GET endpoint auto-seeds 5 default root accounts on first access** (Receitas, Despesas, Ativo, Passivo, Patrimônio Líquido) via `seedDefaultChartAccounts(tenantId)` method.

**Storage Layer:** PostgreSQL-backed via Drizzle ORM, implementing multi-tenant isolation through a `tenantId` parameter in all business data operations. This ensures data is scoped to the authenticated user's tenant.

**Multi-Tenant Architecture:**
- **Tenant Model**: Row-level multi-tenancy where each admin is a separate tenant.
- **Isolation Method**: `tenantId` column in all business data tables.
- **Security Helper**: `getTenantId(user)` extracts tenantId from the authenticated user.
- **API Layer**: All routes automatically inject `tenantId` and never accept it from the client.
- **Storage Layer**: All methods enforce `tenantId` filtering.
- **Performance Optimizations**: Composite indexes on `(tenantId, id)`, `(tenantId, code)`, etc.
- **Versioning System**: All business tables include `updated_at`, `version`, `deleted` columns for incremental sync and soft-deletion.
- **Row-Level Security (RLS)**: PostgreSQL RLS enabled on sensitive tables using `current_setting('app.tenant_id')`.
- **Atomic Version Increment**: `version = version + 1` via SQL on all mutations.

**Automatic Code Generation System:**
- **Design**: Hybrid approach using integer storage in the database for performance and frontend formatting for user experience.
- **Thread-Safety**: PostgreSQL advisory locks prevent race conditions during code generation.
- **Unique Constraints**: Implemented on `(tenantId, code)` for companies and `(tenantId, code, type)` for categories.
- **Formatters**: Frontend functions convert integer codes to user-friendly formats (e.g., "EMP001", "REC001").
- **Security**: Codes are always auto-generated by the backend.
- **Multi-Tenant**: Each tenant has independent code sequences.

**Data Storage Solutions:**
- **Database:** Neon Serverless PostgreSQL, Drizzle ORM for schema and migrations.
- **Schema:** Shared between client/server, including tables for `sessions`, `users`, `companies`, `user_companies`, `company_members`, `categories`, and `chart_of_accounts`, all with appropriate `tenantId` and `companyId` for isolation.

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