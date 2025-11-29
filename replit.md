# EasySplit - Bill Splitting Web Application

## Overview

EasySplit is a mobile-first web application designed for splitting restaurant bills. It allows users to create and share menus, then calculate individual costs based on what each person ordered, including service charges and tips. The application streamlines two core workflows: menu creation (parsing or manual entry) and bill splitting (loading menus, assigning items, and calculating totals). It also supports multi-currency, shareable bill split links, collaborative split adjustments, and personal bill history tracking. The goal is to provide a seamless, intuitive experience for group dining cost division.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Framework**: React 18 with TypeScript and Vite.
**Routing**: Wouter for lightweight client-side navigation.
**UI/UX**: shadcn/ui (built on Radix UI) for accessible components, Tailwind CSS for styling, and a Material Design-inspired aesthetic optimized for mobile-first touch interactions (max-w-2xl containers, 40px+ tap targets).
**State Management**: React hooks for local state, TanStack Query for server state and caching, and Session Storage for ephemeral data transfer between pages. No global state management library is used.
**Form Handling**: React Hook Form with Zod for validation.
**Key Features**: Menu CRUD, multi-currency support (8 common currencies), shareable bill split links, collaborative split adjustments, personal split history, itemized breakdowns, and robust session management for in-progress splits.

### Backend

**Runtime**: Node.js with Express.js.
**API Design**: RESTful JSON API with endpoints for menu and bill split management (CRUD for menus, create/get/update for splits, retrieve splits associated with a menu).
**Data Validation**: Zod schemas are shared between frontend and backend for consistent runtime type checking.
**Database Abstraction**: A single database helper module (`server/db.ts`) allows for easy swapping of database implementations.
**Key Decisions**: Minimal API surface due to client-side calculations, and the database abstraction layer facilitates future migration to cloud-native databases.

### Data Storage

**Current Implementation**: Better-SQLite3.
**Schema**: `menus` (id, code, name, currency, created_at), `menu_items` (id, menu_id, name, price), and `bill_splits` (id, code, name, menu_code, people, items, quantities, currency, service_charge, tip_percent, totals, created_at).
**Persistence Strategy**: Menus, menu items, and saved bill splits are stored in the database. In-progress calculations and owned menu codes are stored ephemerally (Session/Local Storage). User accounts/authentication are not stored.
**Migration Path**: Configured for Drizzle ORM with PostgreSQL dialect, enabling future migration to databases like Neon Serverless PostgreSQL or Cloudflare D1.

## External Dependencies

**Core Frameworks**: React 18, Vite, Express.js, Wouter.
**Database & ORM**: better-sqlite3, drizzle-orm, @neondatabase/serverless (for future use).
**UI Components**: @radix-ui/*, tailwindcss, class-variance-authority, lucide-react.
**Data & Forms**: zod, react-hook-form, @hookform/resolvers, @tanstack/react-query.
**Utilities**: nanoid, date-fns, clsx, tailwind-merge.
**Development Tools**: TypeScript, @replit/vite-plugin-*.