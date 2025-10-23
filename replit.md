# FinControl - Financial Management System

## Overview

FinControl is a comprehensive financial management platform designed for individuals and businesses (including MEI). It features a modern, Apple-inspired minimalist landing page and a full-featured dashboard for managing financial transactions, accounts, categories, and generating reports. The application is a full-stack TypeScript solution utilizing a React frontend, Express backend, and PostgreSQL database with Drizzle ORM. Key capabilities include multi-company management and a hierarchical user system with collaborator invitations and granular access control.

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
- Responsive sidebar layout.
- **Custom Local Authentication:** Email/password with bcryptjs, user profile display, logout.
- **Dashboard Design:** KPI cards with gradient backgrounds and sparklines, clean financial LineChart, heatmap table for department performance.
- **Minha Empresa (My Company) Page:** Master-detail interface for managing multiple companies (CRUD operations), responsive layout, TanStack Query for data, localStorage for selected company persistence, data-testid for accessibility.
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
- **Collaborator Management:**
    - `GET /api/collaborators`: List collaborators (admin only).
    - `POST /api/collaborators`: Create and invite collaborator (admin only).
    - `PATCH /api/collaborators/:id/status`: Activate/deactivate (admin only).
    - `POST /api/collaborators/:id/resend-invite`: Resend invite (admin only).
    - `POST /api/accept-invite`: Collaborator accepts invite (public).
    - Email invites via Nodemailer, time-limited `nanoid` tokens.
- Request logging middleware.

**Storage Layer:** PostgreSQL-backed via Drizzle ORM with an `IStorage` abstraction. CRUD operations for users, companies, and user-company relationships. Includes methods for user management (create, update, get by email/ID, list collaborators), company management (list, get, create, update), and user-company assignments.

**Data Storage Solutions:**
- **Database:** Neon Serverless PostgreSQL, Drizzle ORM. Migrations via Drizzle Kit.
- **Schema:** Shared between client/server.
    - `sessions` table: PostgreSQL-backed session storage.
    - `users` table: User authentication, profile, roles ("admin", "collaborator"), status, invite tokens, hierarchical `adminId`.
    - `companies` table: Multi-company data (seeded with 3 records).
    - `user_companies` table: Many-to-many relationship for user-company access.

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