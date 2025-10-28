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
- **Lançamentos (Transactions) Page:**
    - **Redesigned Layout (Optimized for Transaction List Priority):**
        - Desktop (>1024px): Vertical month sidebar (w-32, 128px) on left + main content on right
        - Mobile (<1024px): Horizontal scrollable month bar at top
        - Transaction list prioritized: occupies 91% of viewport height
        - KPI cards ultra-compact: ~60-70px height (reduced from ~120px)
        - All elements compact: p-3 padding, h-8 inputs, text-xs/text-sm typography
    - **Temporal Navigation System:**
        - Desktop: Vertical month stack (JAN-DEZ) in left sidebar with year selector at top and "Hoje" button at bottom
        - Mobile: Horizontal scrollable month rail with inline year controls
        - Year selector dropdown (last 5 years + next 2 years) with previous/next navigation buttons
        - "Hoje" (Today) button to instantly return to current month/year
        - Visual indicators: selected month highlighting, current month border (border-primary), transition animations
        - **Enhanced Month Buttons with YoY Indicators:**
            - Single-row compact layout (h-9) showing: Month name + YoY percentage
            - Clean white background with subtle separators between months
            - Year-over-Year comparison always visible (shows 0% when no previous year data)
                - Green for growth (e.g., +25%)
                - Red for decline (e.g., -10%)
                - Muted for neutral/no data (0%)
            - Visual indicators:
                - Selected month: Bottom border (primary color) + larger text (text-base) + primary color
                - Current month (not selected): Chevron arrow (→) before month name
                - Regular months: Standard size (text-sm)
            - Smooth transitions for all state changes
        - **Data Queries for YoY:**
            - Current year transactions (month badges)
            - Previous year transactions (YoY comparison)
            - Automatic calculation of percentage change per month
        - Keyboard shortcuts: Arrow Left/Right (month), Ctrl+Arrow Left/Right (year), Home/End (Jan/Dec), T (today)
        - Period display showing current view in header subtitle (e.g., "Outubro de 2025")
    - **Analytics Dashboard:**
        - 4 ultra-compact KPI cards with real-time calculations:
            - Despesas Abertas (Open Expenses): Sum of pending expenses
            - Receitas Abertas (Open Revenues): Sum of pending revenues
            - Em Atraso (Overdue): Sum of pending transactions past due date
            - Resultado (Result): Net result of paid transactions (revenues - expenses)
        - KPI comparison: Result card shows percentage change vs previous month with trending indicator (up/down arrow)
        - Automatic filtering by selected month/year period
        - Grid layout: 2 columns mobile, 4 columns desktop
        - Left-border color coding (2px): red/green/orange/blue for visual identification
    - **Data Queries:**
        - Current month transactions (list display + KPIs)
        - Full year transactions (month badge counters)
        - Previous month transactions (comparison metrics)
    - **Essential Filters:**
        - Search by description (compact h-8 input)
        - Type filter (all, expense, revenue)
        - Status filter (all, pending, paid, cancelled)
    - **Transaction List:**
        - Virtualized list using @tanstack/react-virtual for performance with large datasets
        - Color-coded badges (red for expenses, green for revenues)
        - Overdue indicator (orange) for unpaid transactions past due date
        - Mobile-first responsive grid (1 column mobile → 2 columns tablet → 4 columns desktop)
        - Loading states with skeletons and empty state messages
        - Compact card design: p-3 padding, text-sm/text-xs, text-lg for values
    - **TransactionDialog Component (Create/Edit):**
        - **Responsive Design:** Sheet component on mobile (<768px), Dialog on desktop
        - **Form Fields:**
            - Type toggle (Despesa/Receita) at top
            - Title (required), Description (optional)
            - Amount (required, numeric validation)
            - Issue Date & Due Date (date pickers with z.coerce.date() for JSON compatibility)
            - Status selector (pending/paid/cancelled)
            - Person (customer/supplier), Cost Center, Chart Account (optional selects)
            - Progressive Disclosure: Paid Date and Bank Account fields only visible when status="paid"
            - Payment Method, Tags (optional)
        - **Form State Management:**
            - React Hook Form + Zod validation with insertTransactionSchema
            - useEffect hook resets form on open/close to prevent stale data
            - Handles both create (transaction=null) and edit (transaction=object) modes
            - Default values populated from transaction prop or sensible defaults
        - **API Integration:**
            - POST /api/transactions for create (onSuccess invalidates cache)
            - PUT /api/transactions/:id for update (future enhancement)
            - Dates converted to ISO strings before API submission
            - WebSocket broadcasts update to all connected clients
        - **UX Features:**
            - "Novo" button in header opens dialog for new transaction
            - Form validates on submit with error messages
            - Success toast notification on save
            - Auto-close on successful save
    - Real-time WebSocket updates for all CRUD operations
    - **Demo User:** demo@fincontrol.com / senha123 with pre-created company for testing

### Backend Architecture

The backend utilizes Node.js with TypeScript, Express.js, Drizzle ORM, esbuild for production, and tsx for development. It provides a RESTful API with `/api` prefix, handling authentication, and various management endpoints.

Key architectural decisions include:
- **Authentication:** Signup, login, logout, and user management using Passport Local Strategy with session-based authentication.
- **Management Endpoints:** CRUD operations for `companies`, `collaborators`, `company_members`, `cost-centers`, `chart-of-accounts`, `bank-accounts`, `pix-keys`, `payment-methods`, `customers-suppliers`, `cash-registers`, and `transactions`, all enforcing multi-tenant isolation.
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