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
- **Routing Strategy**: Two main routes - public landing (/) and protected dashboard (/dashboard/*)

**Key Features:**
- Modular component architecture with reusable UI primitives
- Chart visualizations using Recharts
- Form handling with React Hook Form
- Responsive sidebar layout for dashboard
- Modal-based login system

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Build**: esbuild for production bundling
- **Development**: tsx for TypeScript execution

**API Design:**
- RESTful API pattern with `/api` prefix for all routes
- Session-based authentication (scaffolded but not fully implemented)
- Request logging middleware with performance tracking
- JSON body parsing with raw body preservation for webhook support

**Storage Layer:**
- Dual storage interface: In-memory (MemStorage) and database-backed
- Storage abstraction allows easy switching between implementations
- CRUD operations for user management (extensible for other entities)

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

**Current Schema:**
- Users table with UUID primary keys, username, and password fields
- Zod validation schemas for type-safe data insertion

**Design Decisions:**
- Shared schema approach allows type safety across frontend/backend
- Session storage uses connect-pg-simple for PostgreSQL-backed sessions
- Database URL configured via environment variable (DATABASE_URL)

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