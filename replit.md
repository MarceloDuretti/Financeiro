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

**Apple Top Design Pattern:**
FinControl follows a standardized design pattern called "Apple Top" for all detail sheets and master-detail views:
- **Sheet Component:** Uses shadcn Sheet with `modal={true}` for focused interactions
- **Two-Column Layout:** Left side displays a compact info card with key data; right side shows detailed fields
- **Status Badges:** Color-coded badges (Ativa=green `bg-green-600`, Inativa=gray `bg-gray-500`, Pendente=yellow `bg-yellow-600`)
- **Responsive Width:** `sm:max-w-4xl` (view mode) / `sm:max-w-6xl` (edit mode)
- **Spacing:** `space-y-2` (view mode) / `space-y-1.5` (edit mode) for compact, clean layouts
- **Grid Layout:** 4-column grid (`grid-cols-4 gap-4`) for related fields when editing
- **Read-Only Styling:** `border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium` for non-editable fields
- **Action Buttons:** Positioned in footer (bottom) of Sheet, not in header
- **Typography:** SF Pro Display font family for clean, Apple-like text rendering
- **Visual Hierarchy:** Cards use `p-2 space-y-1` for compact layouts in list views, badges at `text-[10px] h-5 px-1.5`
- **Interactive States:** `hover-elevate` and `active-elevate-2` for smooth, elevated interactions

**Technical Implementations & Feature Specifications:**

*   **Authentication:** Custom local email/password authentication using `bcryptjs` and session-based storage. Hierarchical user management (admin/collaborator) with email invitations.
*   **Multi-Tenancy:** True multi-tenant architecture with `tenantId` for row-level isolation across all business data tables. Security helpers at the API layer and `tenantId` filtering in the storage layer. PostgreSQL Row-Level Security (RLS) is enabled.
*   **Real-time Updates:** Integrated WebSocket server with session-based authentication and tenant isolation, broadcasting CRUD changes to connected clients for instant UI updates.
*   **Automatic Code Generation:** Hybrid approach using integer storage and frontend formatting. Thread-safe generation via PostgreSQL advisory locks, ensuring unique codes per `(tenantId, companyId)`.
*   **Data Management Features (CRUD):**
    *   **Companies:** Multi-company management with team member capabilities.
    *   **Team Members & Users:** Hierarchical user management and invitation system.
    *   **Cost Centers:** Auto-code generation and real-time stats.
    *   **Chart of Accounts:** Hierarchical tree structure (max 5 levels) with auto-seeded defaults, VS Code-inspired UI, and auto-generated codes using materialized path. **AI-Powered Generation:** Intelligent chart of accounts generation using OpenAI GPT-4o-mini with contextual analysis. AI performs two-layer analysis: (1) detects specific items mentioned by user (e.g., "água", "luz", "AWS") and guarantees their inclusion, (2) analyzes business type/industry to generate relevant additional accounts. **CRITICAL:** AI always generates the 5 root accounts first (1-Receitas, 2-Despesas, 3-Ativo, 4-Passivo, 5-Patrimônio Líquido) followed by 50-70 detailed analytical subaccounts ready for real-world use. **Editable Preview:** Before confirming creation, users can delete unwanted subaccounts (with validation preventing deletion of parent accounts with children). **Root Account Protection:** The 5 root accounts are protected and cannot be modified or deleted. Visual indicators (lock icon + "Protegida" label) clearly mark protected accounts, and delete buttons are hidden for root accounts. Preview mode allows reviewing and removing unwanted AI-generated subaccounts before database insertion.
    *   **Bank Accounts:** Management of financial control fields and PIX keys, prepared for Open Banking.
    *   **Payment Methods:** Pre-defined, user-activatable/deactivatable methods.
    *   **Customers & Suppliers:** Dual-role entities, multi-step wizard for creation, inline editing, and WebSocket updates. **AI Assistant Integration:** Intelligent entity registration using OpenAI GPT-4o-mini with voice recognition (Web Speech API) and CNPJ enrichment via ReceitaWS public API. Users can speak or type input, and the system extracts entity data using AI and validates/enriches with Brazil's Federal Revenue database when CNPJ is provided. Features confidence scoring, source attribution (AI/ReceitaWS/Hybrid), and preview confirmation dialog before data insertion. **CNPJ Input System:** User must explicitly provide CNPJ for complete data enrichment. Input supports: (1) Pure CNPJ with auto-formatting (XX.XXX.XXX/XXXX-XX), real-time validation, and direct ReceitaWS lookup (bypasses AI for efficiency), or (2) Free text with CNPJ included (AI extracts then enriches). **Digit Limit Enforcement:** Robust frontend normalization ensures no input can contain more than 14 total digits (CNPJ length), counting across all separators (spaces, dots, hyphens, en-dash, parentheses, etc.). System truncates at 14th digit regardless of formatting, preventing invalid CNPJs from reaching backend. Works for manual typing, paste, and voice recognition. **Cost Optimization:** Automatic CNPJ discovery via web search was removed to eliminate Google Custom Search API costs and 401 errors. System now operates with zero external search API dependencies, relying only on user-provided CNPJs for ReceitaWS enrichment. Pure CNPJ inputs bypass AI entirely for maximum efficiency and reliability.
    *   **Cash Registers:** Auto-generated codes, financial info display, operation history, and WebSocket updates.
    *   **Transactions:** Redesigned layout prioritizing the transaction list, temporal navigation system with YoY comparison, compact KPI cards, essential filters, virtualized list for performance, and a 5-step multi-step wizard for creation/editing with progressive summaries and consistent color coding (blue for revenue, red for expense). **Three view modes:** cards (grid), list (detailed), and week (7-column calendar). **Week View Features:** Complete week visualization with buffer data for weeks crossing month boundaries, dedicated navigation (Anterior/Próxima/Hoje), and day-by-day grouping. **KPI Consistency:** All KPIs (monetary values and counters) remain month-scoped regardless of view mode or selected week, ensuring accurate financial metrics. **Smart Data Flow:** Single query with buffer (startOfWeek to endOfWeek) for complete weeks, filtered to monthOnlyTransactions for KPIs, and further filtered by week range only in week view mode.
*   **Performance:** Optimized with composite indexes and virtualized lists for large datasets.
*   **Data Integrity:** Monetary values stored as text/string to prevent floating-point precision issues. Versioning and soft-deletion (`updated_at`, `version`, `deleted` columns). **Duplicate Prevention:** Dual-layer protection against double-submit race conditions: Frontend uses `form.formState.isSubmitting` (flips immediately on submit, before async validation) to disable submit buttons; Backend enforces uniqueness checks for name (case-insensitive) and document (normalized) within advisory-locked transactions, preventing concurrent requests from creating duplicates.
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
*   **AI/ML:** OpenAI GPT-4o-mini (via direct API calls using fetch, cost-optimized for production)