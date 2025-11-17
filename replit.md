# EasySplit - Bill Splitting Web Application

## Overview

EasySplit is a mobile-friendly web application designed for splitting restaurant bills among groups. The application allows users to create and share menus with unique codes, then calculate individual costs based on what each person ordered. It features a responsive, app-like interface optimized for mobile devices while remaining functional on desktop.

The application supports two primary workflows:
1. **Menu Creation**: Parse or manually create restaurant menus and generate shareable 6-character codes
2. **Bill Splitting**: Load menus by code or create ad-hoc items, assign people to orders, and calculate individual totals including service charges and tips

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 2025 - Phase 2 Features
- **Menu Editing & Deletion**: Added PATCH and DELETE endpoints for /api/menus/:code, created edit-menu page with full CRUD operations, localStorage tracking of owned menus, and delete confirmation dialogs
- **Multi-Currency Support**: Extended database schema with currency field (with automatic migration for existing databases), added CurrencySelector component with 8 common currencies (£, $, €, ¥, ₹, C$, A$, CHF), currency persists with menus and loads correctly in split-bill flow
- **Shareable Bill Split Links**: Implemented bill_splits table with POST/GET /api/splits endpoints, results page "Save & Share" functionality, /split/:code view page, comprehensive Zod validation, code normalization, and persistent totals to prevent recalculation drift
- **Bill History**: Added collapsible "Past Splits" section on split-bill page showing all previous splits for loaded menus, with GET /api/menus/:code/splits endpoint, React Query auto-fetch with cache invalidation, complete state management (loading/error/empty/data), split cards displaying code/date/participants/totals, currency preservation (each split displays its saved currency even after menu currency changes), and navigation to split detail pages

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for lightweight client-side routing with the following pages:
- `/` - Home page with two main action buttons
- `/create-menu` - Menu creation interface
- `/edit-menu/:code` - Menu editing interface
- `/split-bill` - Bill splitting calculator
- `/results` - Calculation results display (with save & share functionality)
- `/split/:code` - View saved split breakdown
- `404` - Not found page

**UI Component System**: 
- **shadcn/ui** component library built on Radix UI primitives for accessible, customizable components
- **Tailwind CSS** for styling with custom design tokens following Material Design principles
- **Design System**: Material Design-inspired approach with Inter/Roboto fonts, optimized for mobile-first touch interactions
- Custom color scheme using HSL values with CSS variables for theming support
- Consistent spacing using Tailwind's spacing scale (2, 4, 6, 8 units)

**State Management**:
- React hooks for local component state
- TanStack Query (React Query) for server state management and API caching
- Session storage for passing calculation data between split-bill and results pages
- No global state management library (Redux/Zustand) - state is kept local and request-based

**Form Handling**: React Hook Form with Zod for validation (resolver configured but forms use manual validation)

**Key Design Decisions**:
- Mobile-first responsive design with max-width containers (max-w-2xl) optimized for readability
- Touch-friendly UI elements (minimum 40px/10 Tailwind units for tap targets)
- In-memory calculation on frontend - order quantities not persisted to database
- Session storage used to pass results data without URL parameters

### Backend Architecture

**Runtime**: Node.js with Express.js HTTP server

**API Design**: RESTful JSON API with seven endpoints:
- `POST /api/menus` - Create menu with items, returns generated code
- `GET /api/menus/:code` - Retrieve menu and items by 6-character code
- `PATCH /api/menus/:code` - Update menu name, currency, and items
- `DELETE /api/menus/:code` - Delete menu and all items
- `POST /api/splits` - Save bill split calculation with unique code
- `GET /api/splits/:code` - Retrieve saved split by 6-character code
- `GET /api/menus/:code/splits` - Get all splits associated with a menu

**Data Validation**: Zod schemas for runtime type checking and validation on both API routes and shared types

**Database Layer**: 
- **Abstraction Pattern**: Single database helper module (`server/db.ts`) encapsulating all database operations
- Provides clean interface for swapping database implementations (SQLite → PostgreSQL/D1)
- Methods: `createMenu()`, `getMenuWithItems()`, `generateUniqueCode()`

**Development Server**:
- Vite middleware integration for HMR in development
- Custom request logging middleware for API routes
- Express serves built static files in production

**Key Architectural Decisions**:
- Database abstraction enables future migration to cloud databases (Cloudflare D1, Neon PostgreSQL)
- Minimal API surface - only two endpoints needed since calculations happen client-side
- Zod schemas shared between frontend and backend via `shared/schema.ts`
- Menu codes generated using crypto.randomBytes() for uniqueness

### Data Storage

**Current Implementation**: Better-SQLite3 (synchronous SQLite)

**Schema**:
```
menus
  - id (INTEGER PRIMARY KEY)
  - code (TEXT UNIQUE, 6 characters)
  - name (TEXT, optional)
  - currency (TEXT, default '£')
  - created_at (TEXT timestamp)

menu_items
  - id (INTEGER PRIMARY KEY)
  - menu_id (INTEGER FOREIGN KEY)
  - name (TEXT)
  - price (NUMBER)

bill_splits
  - id (INTEGER PRIMARY KEY)
  - code (TEXT UNIQUE, 6 characters)
  - menu_code (TEXT, nullable, links to menu)
  - people (TEXT, JSON array)
  - items (TEXT, JSON array)
  - quantities (TEXT, JSON array)
  - currency (TEXT, default '£')
  - service_charge (REAL)
  - tip_percent (REAL)
  - totals (TEXT, JSON array)
  - created_at (TEXT timestamp)
```

**Migration Path**: Configured for Drizzle ORM with PostgreSQL dialect (see `drizzle.config.ts`), enabling future migration to:
- Neon Serverless PostgreSQL
- Cloudflare D1
- Other PostgreSQL-compatible databases

**Data Storage Strategy**:
- **Stored in Database**: Menus, menu items, and saved bill splits (with all calculation details)
- **Ephemeral (Session/Local Storage)**: In-progress split calculations, owned menu codes
- **Not Stored**: User accounts/authentication

**Persistence Features**:
- Results page persists split code to sessionStorage
- On reload, fetches saved split from API and displays persisted totals
- Prevents recalculation drift by using server-stored values

### External Dependencies

**Core Framework Dependencies**:
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Express.js** - HTTP server
- **Wouter** - Lightweight routing (~1.2KB)

**Database & ORM**:
- **better-sqlite3** - Current SQLite implementation (synchronous)
- **drizzle-orm** - Type-safe ORM (configured for PostgreSQL migration)
- **@neondatabase/serverless** - Neon PostgreSQL driver (for future use)

**UI Component Libraries**:
- **@radix-ui/* (multiple packages)** - Headless accessible UI primitives (accordion, dialog, dropdown, etc.)
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Component variant utilities
- **lucide-react** - Icon library

**Data & Forms**:
- **zod** - Schema validation and type inference
- **react-hook-form** - Form state management
- **@hookform/resolvers** - Zod integration
- **@tanstack/react-query** - Server state management

**Utilities**:
- **nanoid** - Unique ID generation for frontend entities
- **date-fns** - Date manipulation
- **clsx & tailwind-merge** - Conditional className utilities

**Development Tools**:
- **TypeScript** - Type safety
- **@replit/vite-plugin-*** - Replit-specific development plugins (runtime errors, cartographer, dev banner)

**Session Management**:
- **connect-pg-simple** - PostgreSQL session store (configured but sessions not currently used)

**Key Dependency Decisions**:
- Chose better-sqlite3 over Drizzle's built-in driver for synchronous operations
- Used Wouter instead of React Router for minimal bundle size
- Selected shadcn/ui + Radix for accessible, customizable components without opinionated styling
- TanStack Query provides caching and request deduplication without additional complexity