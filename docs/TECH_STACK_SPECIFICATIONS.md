# ACIMS - Technology Stack Specifications

**Project:** Automated Canteen & Inventory Management System
**Architecture:** Full-Stack Next.js Application with MongoDB
**Last Updated:** 2024-01-15

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Frontend Stack](#frontend-stack)
3. [Backend Stack](#backend-stack)
4. [Database & Data Layer](#database--data-layer)
5. [External Services](#external-services)
6. [Development Tools](#development-tools)
7. [Deployment & Infrastructure](#deployment--infrastructure)
8. [Project Structure](#project-structure)
9. [Environment Configuration](#environment-configuration)

---

## Tech Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  Next.js 14 App Router + React 18 + TypeScript              │
│  shadcn/ui + Tailwind CSS + Framer Motion                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  Server Actions + API Routes + Middleware                    │
│  NextAuth.js (JWT) + RBAC + Validation (Zod)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  Services + Controllers + Utilities                          │
│  React Query (Server State) + Zustand (Client State)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  MongoDB 6+ + Mongoose ODM + Redis Cache                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               EXTERNAL INTEGRATIONS                          │
│  HRMS API | Biometric Devices | Email | Storage | SMS       │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Stack

### Core Framework

**Next.js 14.x (App Router)**
- **Why:** Server-side rendering, React Server Components, built-in API routes, file-based routing, SEO optimization
- **Features Used:**
  - App Router with nested layouts
  - Server Components for performance
  - Server Actions for mutations
  - Streaming with Suspense
  - Parallel routes for complex dashboards
  - Route handlers for API endpoints

**React 18.x**
- **Why:** Latest React features, concurrent rendering, automatic batching
- **Features Used:**
  - Server Components
  - Suspense boundaries
  - useTransition for smooth UX
  - useOptimistic for optimistic updates

**TypeScript 5.x**
- **Why:** Type safety, better DX, reduced runtime errors, self-documenting code
- **Features Used:**
  - Strict mode enabled
  - Type inference
  - Generics for reusable components
  - Zod integration for runtime validation

---

### UI & Styling

**Tailwind CSS 3.x**
- **Why:** Utility-first, rapid development, small bundle size, consistent design
- **Configuration:**
  ```js
  // Custom theme with brand colors
  colors: {
    primary: { ... },
    secondary: { ... },
    success: { ... },
    warning: { ... },
    error: { ... }
  }
  ```
- **Plugins:**
  - `@tailwindcss/forms`
  - `@tailwindcss/typography`
  - `tailwind-scrollbar`

**shadcn/ui**
- **Why:** Accessible, customizable, copy-paste components, built on Radix UI
- **Components Used:**
  - Button, Input, Select, Checkbox, Radio
  - Table, DataTable (with sorting, filtering, pagination)
  - Dialog, AlertDialog, Sheet, Drawer
  - Dropdown Menu, Context Menu
  - Tabs, Accordion, Collapsible
  - Card, Badge, Avatar
  - Toast, Alert
  - Calendar, Date Picker
  - Form (react-hook-form integration)
  - Skeleton (loading states)
  - Tooltip, Popover
  - Command (search/command palette)

**Radix UI**
- **Why:** Unstyled, accessible components (WCAG 2.1)
- **Used via shadcn/ui**

**Lucide React**
- **Why:** Modern, consistent icon library (800+ icons)
- **Usage:** Icons throughout the application

**Framer Motion**
- **Why:** Smooth animations and transitions
- **Usage:**
  - Page transitions
  - Modal animations
  - Toast notifications
  - Hover effects
  - Skeleton loading

**clsx + tailwind-merge**
- **Why:** Conditional class names, Tailwind class merging
- **Usage:** Utility function for dynamic classes

---

### State Management

**React Query (TanStack Query) v5**
- **Why:** Server state management, caching, automatic refetching, optimistic updates
- **Usage:**
  - Fetching data from API
  - Mutations with optimistic updates
  - Automatic cache invalidation
  - Infinite queries for pagination
  - Devtools for debugging

**Zustand**
- **Why:** Lightweight, simple API, no boilerplate
- **Usage:**
  - Global UI state (sidebar open/close, theme)
  - User preferences
  - Temporary form state
  - Real-time notification state

---

### Form Handling & Validation

**react-hook-form v7**
- **Why:** Performance (no re-renders), easy integration with UI libraries
- **Features:**
  - Form state management
  - Field validation
  - Error handling
  - Controller for custom components
  - Integration with Zod

**Zod**
- **Why:** TypeScript-first schema validation, type inference
- **Usage:**
  - API request/response validation
  - Form validation schemas
  - Environment variable validation
  - Database schema type generation

---

### Data Visualization

**Recharts**
- **Why:** React-native charts, composable, responsive
- **Charts Used:**
  - Line Chart (meal trends)
  - Bar Chart (department-wise consumption)
  - Pie Chart (cost distribution)
  - Area Chart (inventory levels over time)
  - Composed Chart (multi-metric dashboards)

**react-chartjs-2** (Optional Alternative)
- **Why:** More chart types, mature library
- **Usage:** Complex custom charts if needed

---

### Date & Time

**date-fns**
- **Why:** Modular, lightweight, tree-shakeable, immutable
- **Usage:**
  - Date formatting
  - Date calculations
  - Timezone handling
  - Relative time

---

### Real-Time Communication

**Socket.io Client**
- **Why:** Real-time bidirectional communication
- **Usage:**
  - Live meal dashboard updates
  - Real-time device status
  - Live notifications
  - Stock level updates

**Alternative: Pusher Client**
- **Why:** Managed service, no server setup
- **Usage:** Same as Socket.io

---

## Backend Stack

### Core Framework

**Next.js 14 API Routes + Server Actions**
- **Why:** Unified codebase, no separate backend server needed
- **API Routes:** RESTful endpoints at `/app/api/**/*`
- **Server Actions:** Mutations directly from Server Components

**Node.js 20 LTS**
- **Why:** Long-term support, latest features, performance improvements

---

### API Design

**RESTful API**
- **Structure:**
  ```
  GET    /api/employees          - List
  GET    /api/employees/:id      - Get one
  POST   /api/employees          - Create
  PUT    /api/employees/:id      - Update
  DELETE /api/employees/:id      - Delete
  POST   /api/employees/bulk     - Bulk operations
  ```

**Server Actions**
- **Usage:** Form submissions, mutations
- **Benefits:** No manual API calls, progressive enhancement

**API Response Format:**
```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

---

### Authentication & Authorization

**NextAuth.js v5**
- **Why:** Built for Next.js, JWT support, session management, middleware integration
- **Providers:**
  - Credentials (email/password)
  - Future: OAuth (Google, Azure AD)
- **Session Strategy:** JWT (stateless)
- **Features:**
  - Role-based access control (RBAC)
  - Session refresh
  - Protected routes via middleware

**bcryptjs**
- **Why:** Password hashing and comparison
- **Usage:** Hash passwords before storing in DB

**jsonwebtoken**
- **Why:** JWT generation and verification
- **Usage:** Access tokens, refresh tokens

---

### Validation & Security

**Zod**
- **Usage:**
  - API request validation
  - Environment variable validation
  - Type-safe schemas

**express-rate-limit** (via middleware)
- **Why:** Prevent brute force attacks
- **Usage:** Rate limit login, API endpoints

**helmet** (via custom middleware)
- **Why:** Security headers
- **Usage:** Protect against common vulnerabilities

**cors** (via Next.js config)
- **Why:** Control API access
- **Usage:** Allow specific origins

---

### File Handling

**multer** (for file uploads)
- **Why:** Handle multipart/form-data
- **Usage:** Excel uploads, invoice uploads, employee photos

**xlsx** (SheetJS)
- **Why:** Excel parsing and generation
- **Usage:**
  - Import meal commitments
  - Import vendor bills
  - Export reports

**pdfkit** or **puppeteer**
- **Why:** PDF generation
- **Usage:** Generate PDF reports

---

### Background Jobs & Scheduling

**node-cron**
- **Why:** Schedule recurring tasks
- **Usage:**
  - Daily HRMS sync (2 AM)
  - Attendance sync (every 15 min)
  - Low stock alerts (hourly)
  - Daily meal summary (2 PM)

**bull** + **Redis** (Alternative)
- **Why:** Robust job queue, retries, job monitoring
- **Usage:** Heavy background tasks, report generation

---

## Database & Data Layer

### Primary Database

**MongoDB 6.x (Atlas or Self-Hosted)**
- **Why:**
  - Flexible schema for evolving requirements
  - Horizontal scaling with sharding
  - Good for real-time data
  - JSON-like documents (natural fit with JavaScript)
  - Aggregation pipeline for complex reports
  - Change streams for real-time updates

**Mongoose 8.x (ODM)**
- **Why:**
  - Schema validation
  - Middleware (pre/post hooks)
  - Virtuals and methods
  - Population (join-like queries)
  - Query building
  - TypeScript support

**Database Design Principles:**
- Denormalization for read-heavy operations
- Indexing for query performance
- Aggregation pipeline for reports
- TTL indexes for session management
- Text indexes for search

---

### Caching Layer

**Redis 7.x**
- **Why:**
  - In-memory key-value store
  - Sub-millisecond latency
  - Pub/Sub for real-time features
  - Session storage
  - Cache frequently accessed data

**Usage:**
- Attendance data cache (refreshed every 15 min)
- Session storage
- Rate limiting
- Real-time meal count
- Device status cache

---

### Database Indexing Strategy

**Compound Indexes:**
```javascript
// Employees
{ employeeId: 1, status: 1 }
{ department: 1, shift: 1 }

// Meal Transactions
{ date: -1, employeeId: 1 }
{ mealSession: 1, date: -1 }
{ department: 1, date: -1 }

// Inventory
{ itemId: 1, date: -1 }
{ category: 1, status: 1 }

// Stock Movements
{ itemId: 1, date: -1 }
{ type: 1, date: -1 }
```

**Text Indexes:**
```javascript
// For search functionality
{ name: "text", employeeId: "text" } // Employees
{ name: "text", code: "text" }      // Inventory Items
```

**TTL Indexes:**
```javascript
// Auto-delete old sessions
{ createdAt: 1 }, { expireAfterSeconds: 3600 }
```

---

## External Services

### Email Service

**Resend** (Recommended)
- **Why:** Modern API, built for developers, great DX, affordable
- **Usage:** Transactional emails, notifications, reports

**Alternative: SendGrid**
- **Why:** Mature, reliable, good deliverability

**Email Templates:**
- React Email (create templates with React)
- Handlebars (traditional templating)

---

### File Storage

**AWS S3**
- **Why:** Industry standard, reliable, scalable, affordable
- **Usage:**
  - Employee photos
  - Vendor invoices
  - Purchase orders
  - Report exports

**Alternative: Cloudinary**
- **Why:** Image optimization, transformations, CDN
- **Usage:** Employee photos with automatic optimization

---

### SMS Service (Optional)

**Twilio**
- **Why:** Reliable, global coverage
- **Usage:** Critical alerts (low stock, system errors)

---

### Real-Time Service

**Socket.io Server**
- **Why:** Self-hosted, full control
- **Setup:** Separate Node.js server or Next.js custom server

**Alternative: Pusher**
- **Why:** Managed service, no infrastructure management
- **Usage:** Real-time meal dashboard, notifications

---

## Development Tools

### Code Quality

**ESLint 8.x**
- **Why:** Catch errors, enforce code style
- **Config:** `eslint-config-next` + custom rules
- **Plugins:**
  - `@typescript-eslint`
  - `eslint-plugin-react`
  - `eslint-plugin-react-hooks`

**Prettier 3.x**
- **Why:** Consistent code formatting
- **Config:** Custom formatting rules

**Husky**
- **Why:** Git hooks for code quality
- **Hooks:**
  - `pre-commit`: Lint staged files
  - `pre-push`: Run tests

**lint-staged**
- **Why:** Run linters on staged files only
- **Usage:** Paired with Husky

---

### Testing

**Jest 29.x**
- **Why:** Industry standard, great for unit/integration tests
- **Usage:**
  - Unit tests (utilities, hooks)
  - Integration tests (API routes)

**React Testing Library**
- **Why:** Test user behavior, not implementation
- **Usage:** Component testing

**Playwright** (E2E)
- **Why:** Cross-browser E2E testing, auto-wait, great DX
- **Usage:** End-to-end user flows

---

### API Documentation

**Swagger / OpenAPI 3.0**
- **Why:** Interactive API documentation
- **Tool:** `swagger-jsdoc` + `swagger-ui-react`
- **Usage:** Document all API endpoints

---

### Monitoring & Logging

**Sentry**
- **Why:** Error tracking, performance monitoring
- **Usage:** Track frontend and backend errors

**Winston** (Logging)
- **Why:** Flexible logging library
- **Usage:** Application logs with levels (info, warn, error)

**Morgan** (HTTP Logging)
- **Why:** HTTP request logging
- **Usage:** Log all API requests

---

### Version Control

**Git**
- **Platform:** GitHub, GitLab, or Bitbucket
- **Branching Strategy:** Git Flow
  - `main`: Production
  - `develop`: Development
  - `feature/*`: Feature branches
  - `hotfix/*`: Hotfix branches

---

## Deployment & Infrastructure

### Hosting Platform

**Vercel (Recommended)**
- **Why:** Built for Next.js, zero-config, edge functions, auto-scaling
- **Features:**
  - Automatic deployments from Git
  - Preview deployments for PRs
  - Edge network (CDN)
  - Serverless functions
  - Environment variables management

**Alternative: AWS**
- **Services:**
  - **EC2:** Application server
  - **S3:** Static assets, file storage
  - **CloudFront:** CDN
  - **Elastic Load Balancer:** Load balancing
  - **RDS or DocumentDB:** Database (or MongoDB Atlas)
  - **ElastiCache:** Redis

**Alternative: DigitalOcean**
- **Why:** Affordable, simple
- **Services:**
  - App Platform (managed Next.js hosting)
  - Droplets (VPS)
  - Managed MongoDB
  - Spaces (S3-compatible storage)

---

### Database Hosting

**MongoDB Atlas** (Recommended)
- **Why:** Managed service, auto-scaling, backups, monitoring
- **Plan:** M10 or higher (production)

**Alternative: Self-Hosted MongoDB**
- **Where:** AWS EC2, DigitalOcean Droplet
- **Setup:** MongoDB replica set for high availability

---

### Redis Hosting

**Upstash** (Recommended for Vercel)
- **Why:** Serverless Redis, Vercel integration, pay-per-request

**Alternative: Redis Labs**
- **Why:** Managed Redis, reliable

**Alternative: AWS ElastiCache**
- **Why:** Integrated with AWS ecosystem

---

### CI/CD Pipeline

**GitHub Actions**
- **Workflows:**
  - Lint and format check on PR
  - Run tests on PR
  - Auto-deploy to staging on push to `develop`
  - Auto-deploy to production on push to `main`

**Example Workflow:**
```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test

  deploy:
    needs: [lint, test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v2
```

---

## Project Structure

```
acims/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .husky/
│   ├── pre-commit
│   └── pre-push
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (auth)/                   # Auth group (different layout)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/              # Main app (authenticated)
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── employees/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   └── loading.tsx
│   │   │   ├── meals/
│   │   │   │   ├── planning/
│   │   │   │   ├── transactions/
│   │   │   │   ├── sessions/
│   │   │   │   └── guests/
│   │   │   ├── inventory/
│   │   │   │   ├── items/
│   │   │   │   ├── receipts/
│   │   │   │   ├── issuance/
│   │   │   │   └── reconciliation/
│   │   │   ├── procurement/
│   │   │   │   ├── vendors/
│   │   │   │   ├── demands/
│   │   │   │   ├── purchase-orders/
│   │   │   │   └── bills/
│   │   │   ├── reports/
│   │   │   │   ├── meals/
│   │   │   │   ├── inventory/
│   │   │   │   ├── financial/
│   │   │   │   └── audit/
│   │   │   ├── settings/
│   │   │   └── notifications/
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── employees/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── sync-hrms/route.ts
│   │   │   │   └── bulk-import/route.ts
│   │   │   ├── meals/
│   │   │   │   ├── sessions/route.ts
│   │   │   │   ├── commitments/route.ts
│   │   │   │   ├── transactions/route.ts
│   │   │   │   └── verify-eligibility/route.ts
│   │   │   ├── inventory/
│   │   │   │   ├── items/route.ts
│   │   │   │   ├── receipts/route.ts
│   │   │   │   ├── issuance/route.ts
│   │   │   │   └── movements/route.ts
│   │   │   ├── procurement/
│   │   │   │   ├── vendors/route.ts
│   │   │   │   ├── demands/route.ts
│   │   │   │   ├── purchase-orders/route.ts
│   │   │   │   └── bills/route.ts
│   │   │   ├── reports/
│   │   │   │   ├── meal-summary/route.ts
│   │   │   │   ├── financial/route.ts
│   │   │   │   └── inventory/route.ts
│   │   │   ├── integrations/
│   │   │   │   ├── hrms/sync/route.ts
│   │   │   │   ├── biometric/sync/route.ts
│   │   │   │   └── devices/callback/route.ts
│   │   │   └── notifications/route.ts
│   │   ├── layout.tsx                # Root layout
│   │   ├── loading.tsx               # Global loading
│   │   ├── error.tsx                 # Global error
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── MealDashboard.tsx
│   │   │   ├── InventoryWidget.tsx
│   │   │   └── ChartWidget.tsx
│   │   ├── meals/
│   │   │   ├── MealSessionCard.tsx
│   │   │   ├── MealEligibilityBadge.tsx
│   │   │   ├── GuestMealForm.tsx
│   │   │   └── MealTransactionTable.tsx
│   │   ├── inventory/
│   │   │   ├── StockCard.tsx
│   │   │   ├── StockReceiptForm.tsx
│   │   │   ├── LowStockAlert.tsx
│   │   │   └── StockMovementTable.tsx
│   │   ├── procurement/
│   │   │   ├── VendorCard.tsx
│   │   │   ├── PurchaseOrderForm.tsx
│   │   │   └── BillEntryForm.tsx
│   │   ├── reports/
│   │   │   ├── ReportFilters.tsx
│   │   │   ├── ReportTable.tsx
│   │   │   └── ExportButton.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── SearchInput.tsx
│   │       ├── DateRangePicker.tsx
│   │       ├── FileUpload.tsx
│   │       └── ConfirmDialog.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── mongoose.ts           # MongoDB connection
│   │   │   ├── redis.ts              # Redis connection
│   │   │   └── models/               # Mongoose models
│   │   │       ├── User.ts
│   │   │       ├── Employee.ts
│   │   │       ├── MealSession.ts
│   │   │       ├── MealTransaction.ts
│   │   │       ├── InventoryItem.ts
│   │   │       ├── StockMovement.ts
│   │   │       ├── Vendor.ts
│   │   │       ├── PurchaseOrder.ts
│   │   │       └── ...
│   │   ├── services/                 # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── employeeService.ts
│   │   │   ├── mealService.ts
│   │   │   ├── inventoryService.ts
│   │   │   ├── procurementService.ts
│   │   │   ├── reportService.ts
│   │   │   └── integrationService.ts
│   │   ├── utils/
│   │   │   ├── api.ts                # API utilities
│   │   │   ├── auth.ts               # Auth utilities
│   │   │   ├── date.ts               # Date utilities
│   │   │   ├── format.ts             # Formatting utilities
│   │   │   ├── validation.ts         # Validation utilities
│   │   │   └── constants.ts          # Constants
│   │   ├── validations/              # Zod schemas
│   │   │   ├── employee.ts
│   │   │   ├── meal.ts
│   │   │   ├── inventory.ts
│   │   │   └── procurement.ts
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── usePermissions.ts
│   │   │   ├── useRealtime.ts
│   │   │   └── useDebounce.ts
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── api-client.ts             # API client (axios/fetch)
│   │   └── cn.ts                     # clsx + tailwind-merge
│   ├── store/                        # Zustand stores
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── notificationStore.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── models.ts
│   │   ├── api.ts
│   │   └── auth.ts
│   └── middleware.ts                 # Next.js middleware (auth)
├── scripts/
│   ├── seed.ts                       # Database seeding
│   ├── migrate.ts                    # Data migration
│   └── sync-hrms.ts                  # Manual HRMS sync
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Environment Configuration

### Environment Variables

**.env.example**
```bash
# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/acims
MONGODB_DB_NAME=acims

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
JWT_SECRET=your-jwt-secret

# External APIs
HRMS_API_URL=https://hrms.example.com/api
HRMS_API_KEY=your-hrms-api-key
BIOMETRIC_API_URL=https://biometric.example.com/api
BIOMETRIC_API_KEY=your-biometric-api-key

# Email
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@acims.com

# Storage
AWS_S3_BUCKET=acims-storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Optional: SMS
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Real-time
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=ap2

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "prepare": "husky install",
    "seed": "tsx scripts/seed.ts",
    "migrate": "tsx scripts/migrate.ts"
  }
}
```

---

## Key Dependencies Summary

### Production Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",

    // UI & Styling
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "^1.0.0",
    "lucide-react": "^0.400.0",
    "framer-motion": "^11.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",

    // State Management
    "@tanstack/react-query": "^5.40.0",
    "zustand": "^4.5.0",

    // Forms & Validation
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",

    // Database & Auth
    "mongoose": "^8.4.0",
    "next-auth": "^5.0.0-beta",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",

    // Utilities
    "date-fns": "^3.6.0",
    "recharts": "^2.12.0",
    "xlsx": "^0.18.5",
    "socket.io-client": "^4.7.0",

    // Redis
    "ioredis": "^5.4.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",

    // Code Quality
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.2.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",

    // Testing
    "jest": "^29.7.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@playwright/test": "^1.44.0",

    // Others
    "tsx": "^4.11.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
```

---

## Performance Optimizations

### 1. Next.js Optimizations
- Server Components by default (reduce JavaScript bundle)
- Streaming with Suspense
- Image optimization with `next/image`
- Font optimization with `next/font`
- Route prefetching
- Incremental Static Regeneration (ISR) for reports

### 2. Database Optimizations
- Proper indexing (compound indexes)
- Aggregation pipeline for reports
- Lean queries (exclude unnecessary fields)
- Connection pooling
- Query result caching in Redis

### 3. Caching Strategy
- React Query cache (stale-while-revalidate)
- Redis for frequently accessed data
- CDN for static assets
- Browser caching headers

### 4. Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting (automatic with Next.js)
- Lazy load charts and visualizations

### 5. Bundle Size Optimization
- Tree shaking (automatic with Next.js)
- Import only needed components (`import { Button } from '@/components/ui/button'`)
- Analyze bundle with `@next/bundle-analyzer`

---

## Security Best Practices

1. **Environment Variables:** Never commit `.env` files
2. **API Security:** Rate limiting, CORS, helmet
3. **Authentication:** JWT with refresh tokens, HTTP-only cookies
4. **Authorization:** RBAC middleware on all protected routes
5. **Input Validation:** Zod validation on all inputs
6. **SQL Injection Prevention:** Mongoose ODM (parameterized queries)
7. **XSS Prevention:** React's built-in escaping + Content Security Policy
8. **CSRF Protection:** NextAuth handles this
9. **Dependency Security:** Regular `npm audit` and updates

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Next Review:** Before Phase 1 implementation
