# FinControl - Financial Management System

## Overview

FinControl is a comprehensive financial management platform designed for both individual users and businesses (including MEI). The system features a modern landing page with Apple-inspired minimalist design and a complete dashboard application for managing financial transactions, accounts, categories, and generating reports.

The application is built as a full-stack TypeScript solution with a React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite

**Design System:**
- Apple-inspired minimalist aesthetic with mobile-first approach
- Custom color palette: Blue primary (220 100% 40%), neutral grays, gradients
- Typography: SF Pro Display with fallbacks
- Responsive breakpoints: mobile (<640px), tablet (768px), desktop (1024px)
- Component library based on shadcn/ui "new-york" style

**Application Structure:**
- **Landing Page**: Marketing site with hero, features, testimonials, plans, contact sections
- **Dashboard**: Authenticated application with sidebar navigation and multiple feature modules
- **Routing Strategy**: Public landing (/) for non-authenticated users, protected dashboard (/dashboard/*) for authenticated users
- **Authentication**: Replit Auth (OpenID Connect) with automatic login/signup pages

**Key Features:**
- Modular component architecture with reusable UI primitives
- Chart visualizations using Recharts (LineChart, PieChart) and custom heatmap tables
- Form handling with React Hook Form
- Responsive sidebar layout for dashboard
- Full authentication system with Replit Auth (login via Google, GitHub, X, Apple, email/password)
- Protected routes with automatic redirect to login
- User profile display with avatar and logout functionality

**Dashboard Design Decisions (Recent Updates - October 22, 2025):**
- **KPI Cards**: 4 main metrics with Portuguese names (no acronyms), gradient backgrounds, colored icons in blur circles, sparklines - removed progress bars for cleaner look
- **Financial Chart**: Clean LineChart (240px height) showing only Revenues and Expenses with gradients and smooth curves
- **Department Performance**: Custom heatmap table (replaced BarChart) showing monthly spending with color-coded cells (red=high, blue=low) for instant visual pattern recognition with automatic normalization and edge-case handling
- **Landing Page Hero**: Balanced minimalist design with medium-sized feature stats using subtle primary-colored icons (h-8 w-8) on light backgrounds (bg-primary/10)
- **Minha Empresa Page**: Multi-company management system (October 22, 2025)
  - **Design Philosophy**: Master-detail pattern for managing multiple companies in the same group
  - **Architecture**: Full CRUD support with backend API and in-memory storage
  - **Data Model**: Company schema with fiscal, economic, address, contact, and responsible person fields
  - **Backend**:
    - IStorage interface extended with company CRUD methods (listCompanies, getCompanyById, updateCompany)
    - API routes: GET /api/companies (list), GET /api/companies/:id (details), PATCH /api/companies/:id (update)
    - Seed data with 3 example companies for demonstration
  - **UI Layout**: Master-detail with responsive behavior
    - **Left Panel**: Company list table with columns (Code, Name, CNPJ, Phone, Status)
    - **Right Panel**: Detailed company card that appears when clicking a row
    - **Animation**: List width transitions from w-full to md:w-[400px] when details are shown
    - **Selection**: Click table row to select company and show details
  - **Detail Card Sections**:
    - Header with avatar, company names, and status badges
    - Fiscal Data (CNPJ, IE, IM, opening date, tax regime)
    - Economic Activity (primary CNAE)
    - Complete Address with MapPin icon
    - Contact information (phone, email, website)
    - Responsible person with avatar and contact details
  - **State Management**: 
    - TanStack Query for API data fetching
    - localStorage persistence of selected company
    - Proper queryKey structure for list and detail queries
  - **Accessibility**: Complete data-testid coverage on all interactive and display elements

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Build**: esbuild for production bundling
- **Development**: tsx for TypeScript execution

**API Design:**
- RESTful API pattern with `/api` prefix for all routes
- **Authentication**: Full Replit Auth (OpenID Connect) implementation
  - Routes: `/api/login`, `/api/logout`, `/api/callback`, `/api/auth/user`
  - Session-based authentication with PostgreSQL session storage
  - `isAuthenticated` middleware for protected routes
  - Automatic token refresh for long-lived sessions
- Request logging middleware with performance tracking
- JSON body parsing with raw body preservation for webhook support

**Storage Layer:**
- **DatabaseStorage**: PostgreSQL-backed storage using Drizzle ORM
- Storage abstraction (IStorage interface) for clean architecture
- CRUD operations for users and companies
- User operations: `getUser()`, `upsertUser()` (required for Replit Auth)
- Company operations: `listCompanies()`, `getCompanyById()`, `createCompany()`, `updateCompany()`

**Development Setup:**
- Vite dev server middleware integration for HMR
- Custom error overlay for runtime errors (Replit-specific)
- Separate build outputs: frontend (dist/public) and backend (dist)

### Data Storage Solutions

**Database:**
- **Platform**: Neon Serverless PostgreSQL (via @neondatabase/serverless)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Migrations**: Managed via Drizzle Kit (output to ./migrations)
- **Schema Location**: Shared between client/server (./shared/schema.ts)

**Current Schema (Updated October 22, 2025):**
- **sessions table**: PostgreSQL-backed session storage (required for Replit Auth)
  - Fields: sid (PK), sess (jsonb), expire (timestamp with index)
- **users table**: User authentication and profile data (Replit Auth)
  - Fields: id (varchar PK with UUID default), email (unique), firstName, lastName, profileImageUrl, createdAt, updatedAt
  - Type: `UpsertUser` for insertion, `User` for selection
- **companies table**: Multi-company management
  - Fields: id, code, tradeName, legalName, cnpj, phone, status, fiscal data, address, contact, responsible person
  - Type: `InsertCompany` for insertion, `Company` for selection

**Design Decisions:**
- Shared schema approach allows type safety across frontend/backend
- Session storage uses connect-pg-simple for PostgreSQL-backed sessions
- Database URL configured via environment variable (DATABASE_URL)
- All tables created and managed via Drizzle ORM with `npm run db:push`

### External Dependencies

**UI Component Library:**
- Radix UI: Accessible component primitives (accordion, dialog, dropdown, popover, tabs, toast, etc.)
- shadcn/ui: Pre-styled components built on Radix primitives
- Lucide React: Icon library for consistent iconography

**Data Visualization:**
- Recharts: Chart library for dashboard analytics (line, pie, area charts)

**Form Management:**
- React Hook Form: Form state and validation
- @hookform/resolvers: Validation resolver integrations
- Zod: Schema validation (via drizzle-zod)

**Database & Sessions:**
- @neondatabase/serverless: Serverless PostgreSQL driver
- connect-pg-simple: PostgreSQL session store for Express
- Drizzle ORM: Type-safe database operations

**Developer Tools:**
- @replit/vite-plugin-runtime-error-modal: Enhanced error reporting
- @replit/vite-plugin-cartographer: Code navigation (development only)
- @replit/vite-plugin-dev-banner: Development environment indicators

**Utilities:**
- date-fns: Date manipulation and formatting
- clsx & tailwind-merge: Conditional className utilities
- class-variance-authority: Type-safe variant styling
- nanoid: Unique ID generation

**Build Tools:**
- Vite: Frontend build and dev server
- esbuild: Backend bundling
- PostCSS: CSS processing with Tailwind and Autoprefixer
- tsx: TypeScript execution for development