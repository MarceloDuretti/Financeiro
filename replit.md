# FinControl - Financial Management System

## Overview

FinControl is a comprehensive financial management platform for individuals and businesses, featuring an Apple-inspired UI and a full-featured dashboard. It's a full-stack TypeScript solution with React, Express, PostgreSQL, and Drizzle ORM. Key features include a multi-tenant architecture with row-level isolation, a hierarchical user system with granular access control, complete data isolation, and performance optimizations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

FinControl is built as a full-stack TypeScript application. The frontend uses React 18, Wouter, TanStack Query, Radix UI, shadcn/ui, Tailwind CSS, and Vite, adhering to an Apple-inspired minimalist design with mobile-first responsiveness. The backend uses Node.js with TypeScript, Express.js, and Drizzle ORM, providing a RESTful API.

**UI/UX Decisions:**
- Apple-inspired minimalist aesthetic.
- Mobile-first responsiveness.
- Custom color palettes and SF Pro Display typography.
- Modular component architecture with chart visualizations (Recharts) and custom heatmap tables.
- Responsive sidebar layout.
- Consistent use of Sheet drawers for master-detail views (`modal={false}`) and selected item highlighting.
- Transaction Dialog uses a 5-step multi-step wizard for creation/editing, adapting between Sheet (mobile) and Dialog (desktop).
- Visual indicators for active/inactive status, transaction types (red for expenses, blue for revenues), and YoY performance.
- Progressive disclosure in forms and summaries.
- Enhanced month navigation with YoY indicators and keyboard shortcuts.

**Technical Implementations & Feature Specifications:**

*   **Authentication:** Custom local email/password authentication using `bcryptjs` and session-based storage. Hierarchical user management (admin/collaborator) with email invitations.
*   **Multi-Tenancy:** True multi-tenant architecture with `tenantId` for row-level isolation across all business data tables. Security helpers at the API layer and `tenantId` filtering in the storage layer. PostgreSQL Row-Level Security (RLS) is enabled.
*   **Real-time Updates:** Integrated WebSocket server with session-based authentication and tenant isolation, broadcasting CRUD changes to connected clients for instant UI updates.
*   **Automatic Code Generation:** Hybrid approach using integer storage and frontend formatting. Thread-safe generation via PostgreSQL advisory locks, ensuring unique codes per `(tenantId, companyId)`.
*   **Data Management Features (CRUD):**
    *   **Companies:** Multi-company management with team member capabilities.
    *   **Team Members & Users:** Hierarchical user management and invitation system.
    *   **Cost Centers:** Auto-code generation and real-time stats.
    *   **Chart of Accounts:** Hierarchical tree structure (max 5 levels) with auto-seeded defaults, VS Code-inspired UI, and auto-generated codes using materialized path.
    *   **Bank Accounts:** Management of financial control fields and PIX keys, prepared for Open Banking.
    *   **Payment Methods:** Pre-defined, user-activatable/deactivatable methods.
    *   **Customers & Suppliers:** Dual-role entities, multi-step wizard for creation, inline editing, and WebSocket updates.
    *   **Cash Registers:** Auto-generated codes, financial info display, operation history, and WebSocket updates.
    *   **Transactions:** Redesigned layout prioritizing the transaction list, temporal navigation system with YoY comparison, compact KPI cards, essential filters, virtualized list for performance, and a 5-step multi-step wizard for creation/editing with progressive summaries and consistent color coding (blue for revenue, red for expense).
*   **Performance:** Optimized with composite indexes and virtualized lists for large datasets.
*   **Data Integrity:** Monetary values stored as text/string to prevent floating-point precision issues. Versioning and soft-deletion (`updated_at`, `version`, `deleted` columns).
*   **Form Management:** React Hook Form with Zod validation.

## External Dependencies

*   **UI Components:** Radix UI, shadcn/ui, Lucide React
*   **Data Visualization:** Recharts
*   **Form & Validation:** React Hook Form, @hookform/resolvers, Zod
*   **Database:** PostgreSQL (Neon Serverless), Drizzle ORM, @neondatabase/serverless
*   **Authentication:** Passport, Passport-Local, bcryptjs
*   **Session Management:** connect-pg-simple
*   **Email:** Nodemailer (for Gmail SMTP)
*   **Utilities:** date-fns, clsx, tailwind-merge, class-variance-authority, nanoid