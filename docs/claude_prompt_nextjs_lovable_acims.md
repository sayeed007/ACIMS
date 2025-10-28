# Prompt for Claude: Next.js 14 Lovable Project – Stand-alone Canteen & Inventory Management System

## Objective
Generate a **Next.js 14** application with a **modern, lovable UI** built using **shadcn/ui** and **Tailwind CSS**, delivering a delightful and professional experience for a **Stand-alone Canteen & Inventory Management System (ACIMS)**. The design must balance functional clarity with visual elegance — something users love to use every day.

## System Overview
The ACIMS platform manages:
- Employee meal eligibility based on attendance and shifts
- Biometric device integration for meal validation
- Multi-session daily meal tracking (up to 9 sessions per day)
- Inventory, stock movement, and procurement workflows
- Reporting and analytics dashboards for HR, procurement, and management

## Tech Requirements
- **Framework:** Next.js 14 (App Router + Server Actions)
- **Styling:** Tailwind CSS + shadcn/ui + clsx
- **Language:** TypeScript
- **State:** React Query + Zustand
- **Database:** PostgreSQL (Prisma ORM)
- **Auth:** NextAuth (JWT + Credentials)
- **Charts:** Recharts (for analytics dashboards)
- **Forms:** react-hook-form + zod validation
- **Deploy:** Vercel-ready (Edge optimized)

## Lovable Design Goals
Claude should **prioritize emotional connection and smooth flow**:
- Elegant light/dark theme toggle
- Rounded, soft UI edges (rounded-2xl)
- Clear visual hierarchy, generous spacing, warm accent tones
- Motion feedback (Framer Motion micro-interactions)
- Toasts and modals that feel "alive" and trustworthy
- Confident typography (Inter + custom accent font)
- Empty states that inspire engagement (“Let’s add your first meal record!”)

## UX Focus
1. **Meal Management Dashboard**
   - Real-time face-scan validation feed
   - Meal eligibility cards per shift
   - Quick insights: total meals, missed meals, guest meals

2. **Inventory Management**
   - Stock in/out tracking with visual balance indicators
   - Reorder threshold alerts (toast + dashboard badge)

3. **Procurement & Billing**
   - Stepwise approval UI (visual progress component)
   - Vendor list, PO, bill entry with modals/drawers

4. **Reports**
   - Filterable analytics view with charts + exports
   - KPIs like daily meals, cost per meal, vendor summary

5. **User Roles & Access**
   - Store Keeper, Canteen Manager, HR/Admin, Department Head
   - Sidebar and menu adapt to user roles

## Suggested UI Components (shadcn/ui)
- DataTable (sortable, filterable, with persistent state)
- Sheet / Drawer for inline CRUD
- Dialogs for confirmation actions
- Badge + Tooltip for status indication
- Card grid for dashboards
- Tabs for multi-view reports
- Skeletons for loading states
- Toasts and AlertDialog for feedback

## API Endpoints (Next.js Route Handlers)
- `/api/auth/*`
- `/api/meals/*`
- `/api/inventory/*`
- `/api/procurement/*`
- `/api/reports/*`
- `/api/devices/callback` (biometric feed)

## Deliverable Expectations
Claude should output:
- A **Next.js 14 full-stack app scaffold**
- shadcn/ui integrated theme with reusable design tokens
- Example CRUD page for “Inventory Item” with optimistic UI
- Example Dashboard with mock analytics data
- Role-based layout and navigation system
- Sample environment setup (`.env.sample` + Prisma schema)
- Detailed README.md with setup, run, and deployment steps

---

**Tone & Emotion:**
Use a **“Lovable SaaS”** design approach — simple, elegant, human. Every action should feel effortless, every screen balanced. Think **Linear**, **Vercel Dashboard**, and **Notion-style comfort** — polished but approachable.

---
