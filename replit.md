# FinControl - Financial Management System

## Overview

FinControl is a comprehensive financial management platform designed for individuals and businesses (including MEI). It offers a modern, Apple-inspired user interface and a full-featured dashboard for managing financial transactions, accounts, cost centers, and generating reports. The application is built as a full-stack TypeScript solution, leveraging a React frontend, Express backend, and PostgreSQL database with Drizzle ORM. Key capabilities include a true multi-tenant architecture with row-level isolation, a hierarchical user system with granular access control, complete data isolation, and performance optimizations for tenant-scoped queries.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI and shadcn/ui for components, Tailwind CSS for styling, and Vite for building. The design follows an Apple-inspired minimalist aesthetic, emphasizing mobile-first responsiveness, custom color palettes, and SF Pro Display typography. It includes a public landing page and an authenticated dashboard with custom local email/password authentication and session-based storage.

Key features include:
- Modular component architecture with chart visualizations (Recharts) and custom heatmap tables.
- Form handling with React Hook Form and Zod validation.
- Responsive sidebar layout.
- **Custom Local Authentication:** Email/password with bcryptjs, user profile, logout.
- **Dashboard Design:** KPI cards, financial LineChart, heatmap table.
- **Minha Empresa (My Company) Page:** Master-detail interface for managing multiple companies with full CRUD, multi-tenant isolation, and team member management.
- **Team Members Management:** Full CRUD for team members within each company, including soft-delete.
- **Usuarios (Users) Page:** Hierarchical user management (admin/collaborator), CRUD for collaborators, and email invitations.
- **Accept Invite Page:** Public route for collaborator account activation.
- **Centro de Custo (Cost Centers) Page:** Full CRUD for cost centers with auto-code generation and real-time stats.
- **Plano de Contas (Chart of Accounts) Page:**
    - Auto-seeds 5 default root accounts on first access for immediate professional structure.
    - Modern VS Code-inspired UI with connector lines, progressive indentation, hierarchical typography, and hover-only action buttons.
    - Smart tree controls (Expand/Collapse All).
    - Hierarchical tree structure (max 5 levels) with auto-generated codes using advisory locks and a materialized path pattern.
- **Contas Bancárias (Bank Accounts) Page:** Master-detail interface for managing bank accounts (full CRUD), including financial control fields (initial balance, credit limit), and PIX keys management. Prepared for future Open Banking integration with reconciliation fields.
- **Formas de Pagamento (Payment Methods) Page:** Pre-defined selection system of 12 payment methods that users can activate/deactivate (no creation/editing), auto-seeded on first access.
- **Clientes e Fornecedores (Customers & Suppliers) Page:** 
    - Dual-role entities support (customer, supplier, or both) with auto-code generation
    - Responsive grid layout with floating percentage badges and WhatsApp integration
    - Multi-step wizard form for creation only (5 steps: Basic Info, Address, Banking, Additional, Review)
    - Dual-mode drawer: Read-only view mode and inline editing mode
    - Active/Inactive status management with visual indicators (opacity-60 for inactive cards, status badges)
    - Inline editing within drawer (no wizard reopening for edits)
    - Toggle active/inactive functionality with optimistic concurrency control
    - Real-time WebSocket updates for all CRUD operations including status changes
    - **UX Enhancement:** Sheet drawer with `modal={false}` (no dark overlay blocking master list) and selected card highlight (`ring-2 ring-primary`)
- **Caixas (Cash Registers) Page:**
    - Master-detail interface with Sheet drawer following established pattern
    - Grid layout with active/inactive sections and visual status indicators
    - Auto-generated codes (CX001, CX002, etc.) unique per tenant+company
    - Financial information display: current balance, opening balance
    - Operation history tracking: last opened/closed timestamps
    - Status badges: Active/Inactive and Open/Closed indicators
    - Inline editing within Sheet drawer (no dialog reopening)
    - Toggle active/inactive functionality
    - Real-time WebSocket updates for all CRUD operations
    - Search/filter by name or code
    - **UX Enhancement:** Sheet drawer with `modal={false}` (no dark overlay blocking master list) and selected card highlight (`ring-2 ring-primary`)

### Backend Architecture

The backend utilizes Node.js with TypeScript, Express.js, Drizzle ORM, esbuild for production, and tsx for development. It provides a RESTful API with `/api` prefix, handling authentication, and various management endpoints.

Key architectural decisions include:
- **Authentication:** Signup, login, logout, and user management using Passport Local Strategy with session-based authentication.
- **Management Endpoints:** CRUD operations for `companies`, `collaborators`, `company_members`, `cost-centers`, `chart-of-accounts`, `bank-accounts`, `pix-keys`, `payment-methods`, `customers-suppliers`, and `cash-registers`, all enforcing multi-tenant isolation.
- **Storage Layer:** PostgreSQL with Drizzle ORM, implementing multi-tenant isolation via a `tenantId` column in all business data tables.
- **Real-Time Updates System:** Integrated WebSocket server using session-based authentication and tenant isolation. It broadcasts automatic notifications for data changes (CREATE/UPDATE/DELETE) to connected clients, supporting multi-user environments with instant UI updates and auto-reconnection.
- **Multi-Tenant Architecture:** Row-level multi-tenancy enforced by `tenantId` in all business data, with security helpers at the API layer and `tenantId` filtering in the storage layer. Performance is optimized with composite indexes, and PostgreSQL Row-Level Security (RLS) is enabled. Versioning and soft-deletion are supported through `updated_at`, `version`, and `deleted` columns.
- **Automatic Code Generation System:** Hybrid approach using integer storage in the database and frontend formatting. Thread-safe code generation uses PostgreSQL advisory locks. Unique constraints are applied on `(tenantId, code)`, and codes are always auto-generated by the backend, independent per tenant.
- **Data Storage Solutions:** Neon Serverless PostgreSQL with Drizzle ORM for schema and migrations. Monetary values are stored as text/string to prevent floating-point precision issues.

### External Dependencies

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