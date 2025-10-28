# Automated Canteen & Inventory Management System (ACIMS)
## Technical Requirements & Implementation Guide

**Project Type:** Enterprise Canteen Management System
**Target Users:** 3,500+ employees
**Daily Operations:** 7-9 meal sessions per day
**Tech Stack:** Next.js 14 (App Router) + MongoDB + Mongoose

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Detailed Requirements Breakdown](#detailed-requirements-breakdown)
3. [System Architecture](#system-architecture)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Module Specifications](#module-specifications)
6. [Integration Requirements](#integration-requirements)
7. [Non-Functional Requirements](#non-functional-requirements)
8. [Implementation Phases](#implementation-phases)

---

## Executive Summary

### Problem Statement
Replace manual Excel-based canteen operations with an automated digital platform that integrates:
- Facial recognition-based meal validation
- Real-time inventory tracking
- Procurement and financial workflows
- HRMS attendance data synchronization

### Solution Overview
Build a full-stack Next.js 14 application with MongoDB backend that automates:
- **Meal Tracking:** Biometric face verification at canteen entry points
- **Inventory Management:** Real-time stock tracking from procurement to consumption
- **Financial Reporting:** Automated cost allocation per department/employee
- **System Integration:** Seamless API connections with HRMS and Biometric systems

### Key Success Metrics
- Face verification latency < 500ms
- Support 5,000+ users
- Handle 9 meal sessions daily
- Track 5+ years of historical data
- Zero unauthorized meal distribution

---

## Detailed Requirements Breakdown

### 1. HR & Meal Access Management Module

#### 1.1 Employee Management
**Functional Requirements:**
- Sync employee data from HRMS via API (Employee ID, Name, Department, Shift, Status)
- Support dual employee systems:
  - Permanent employees (700 employees)
  - Vendor-based employees (700 employees)
- Import and sync facial biometric templates from existing biometric systems
- Maintain employee shift schedules and attendance status
- Track overtime (OT) eligibility for special meals (e.g., Midnight Tea)

**User Stories:**
- As an HR Admin, I need to sync employee data from HRMS so that meal eligibility is automatically updated
- As a System Admin, I need to import facial data from biometric devices so employees can use face recognition at canteen gates
- As an HR Manager, I need to manage employee shift assignments so the system validates meal eligibility correctly

**Business Rules:**
- Only employees marked "Present" for their shift can access meals
- OT meals are auto-approved based on HRMS OT verification
- Employees without facial data cannot use automated meal access

#### 1.2 Real-Time Meal Eligibility Validation

**Functional Requirements:**
- Deploy ZKTeco-compatible facial recognition devices at all canteen entry points
- Real-time face matching with latency < 500ms
- Display verification results on connected screen:
  - Employee photo
  - Name and department
  - Eligibility status (Green = Authorized, Red = Not Authorized)
- Cross-check attendance and shift data via API before authorization
- Log every meal transaction with:
  - Employee ID
  - Meal type (Breakfast, Lunch, Dinner, Snack, OT Meal)
  - Timestamp
  - Device ID
  - Verification status

**Workflow:**
1. Employee approaches canteen gate with facial recognition device
2. System captures face and matches against synchronized database
3. API checks employee's shift and attendance status from HRMS
4. System validates meal eligibility based on:
   - Current time vs. meal session timing
   - Employee shift schedule
   - Attendance status (Present/Absent)
5. Display shows authorization result with visual feedback
6. If not eligible, employee directed to HR for attendance correction
7. Once HR updates attendance, system auto-refreshes eligibility
8. Transaction logged in real-time to meal dashboard

**User Stories:**
- As an Employee, I need to scan my face at the canteen gate to verify my meal eligibility automatically
- As a Canteen Manager, I need real-time meal transaction logs so I can monitor daily consumption
- As an HR Admin, I need to update attendance records that instantly reflect in meal eligibility

**Technical Requirements:**
- WebSocket or polling mechanism for real-time device communication
- API endpoint to receive biometric device callbacks
- Redis cache for fast attendance status lookup
- Transaction queue for high-volume meal times

#### 1.3 Meal Planning & Scheduling

**Functional Requirements:**
- Manage up to 9 daily meal sessions:
  - Early Morning Tea
  - Breakfast
  - Morning Snack
  - Lunch
  - Afternoon Snack
  - Dinner
  - Evening Snack
  - Midnight Tea (OT)
  - Late Night Meal (OT)
- Department Heads submit daily meal commitments (count per session for next day)
- Support bulk upload via Excel/CSV
- Shift-based automatic eligibility:
  - Day shift: Breakfast, Lunch, Evening Snack
  - Night shift: Dinner, Midnight Tea
  - General staff (8 AM arrival): No breakfast eligibility
- Guest meal request workflow:
  - Department Head requests
  - HR/Admin approves
  - System logs for internal billing

**User Stories:**
- As a Department Head, I need to submit tomorrow's meal count so the canteen can prepare adequate food
- As a Canteen Manager, I need to view all department commitments in one dashboard
- As an HR Admin, I need to approve guest meal requests for visitors and contractors

**Business Rules:**
- Meal commitments must be submitted by 5 PM for next day
- Automated reminders sent at 3 PM if not submitted
- Shift eligibility rules are enforced automatically
- Guest meals require pre-approval from HR/Admin

---

### 2. Inventory & Store Management Module

#### 2.1 Stock Management

**Functional Requirements:**
- **Stock In (Receipt):**
  - Record all received raw materials
  - Capture: Item name, quantity, unit, cost, vendor, invoice reference, receipt date
  - Support bulk entry and invoice scanning
  - Auto-update inventory balance

- **Stock Reconciliation:**
  - Capture opening stock at start of period
  - Compare with current stock
  - Calculate consumption and wastage
  - Generate reconciliation reports

- **Stock Out (Consumption):**
  - Record daily consumption per meal type
  - Link consumption to specific meal sessions
  - Deduct from inventory balance
  - Track consumption patterns

- **Real-Time Stock Status:**
  - Live inventory dashboard
  - Item-wise quantity and valuation
  - Stock movement history
  - Low stock alerts

**User Stories:**
- As a Store Keeper, I need to record stock receipts so inventory is always up to date
- As a Canteen Manager, I need to see real-time stock levels before planning meals
- As a Store Admin, I need to reconcile stock monthly to ensure accuracy

**Business Rules:**
- Stock cannot go negative
- All stock movements require authorization
- Consumption must be linked to meal session
- Reorder threshold configurable per item

#### 2.2 Inventory Tracking & Alerts

**Functional Requirements:**
- Define reorder levels per inventory item
- Auto-generate alerts when stock drops below threshold
- Send notifications to:
  - Store Keeper
  - Canteen Manager
  - Purchase Committee
- Track item expiry dates
- Generate wastage reports

**User Stories:**
- As a Store Keeper, I need automatic low stock alerts so I can reorder items on time
- As a Canteen Manager, I need expiry tracking to minimize waste

---

### 3. Procurement & Financial Workflow Module

#### 3.1 Demand Generation

**Functional Requirements:**
- Auto-generate demand lists based on:
  - Meal commitments from departments
  - Recipe requirements
  - Current stock levels
  - Historical consumption patterns
- Support manual demand creation
- Weekly/monthly demand planning
- Attach supporting documents

**User Stories:**
- As a Canteen Manager, I need the system to auto-generate purchase demands based on meal commitments
- As a Store Keeper, I need to manually add urgent items to demand list

#### 3.2 Vendor Management & Purchase Workflow

**Functional Requirements:**
- Maintain vendor master database:
  - Vendor name, contact, items supplied, payment terms
  - Historical performance tracking
- Purchase Committee workflow:
  - Review demand list
  - Select vendors
  - Approve purchase order
  - Set approval limits
- Purchase Order (PO) generation
- PO tracking and fulfillment status

**User Stories:**
- As a Purchase Committee Member, I need to review and approve demand lists
- As a Store Keeper, I need to match received items against PO

**Business Rules:**
- PO requires Purchase Committee approval
- Vendor selection based on approved vendor list
- PO must be generated before receipt

#### 3.3 Bill Entry & Payment Tracking

**Functional Requirements:**
- Record vendor bills against PO
- Support Excel import for existing bill data
- Track payment status:
  - Pending
  - Partially Paid
  - Fully Paid
- Generate monthly payable summaries per vendor
- Payment history and outstanding balance tracking

**User Stories:**
- As a Finance Admin, I need to import vendor bills from Excel to maintain continuity
- As a Purchase Manager, I need to see outstanding payments per vendor

---

### 4. Reporting & Analytics Module

#### 4.1 Real-Time Dashboards

**Functional Requirements:**
- **Meal Dashboard:**
  - Live meal count per session
  - Today's total meals served
  - Session-wise breakdown
  - Department-wise consumption
  - Guest meal tracking

- **Inventory Dashboard:**
  - Current stock value
  - Item-wise quantity
  - Low stock items highlighted
  - Recent stock movements

- **Financial Dashboard:**
  - Monthly procurement spend
  - Cost per meal
  - Department-wise cost allocation
  - Vendor payment status

**User Stories:**
- As a Canteen Manager, I need a live dashboard showing how many meals have been served today
- As an Admin, I need to see total monthly canteen costs at a glance

#### 4.2 Standard Reports

**Required Reports:**

1. **Daily Meal Report**
   - Date, meal session, planned count, actual count, variance
   - Department-wise breakdown
   - Guest meals

2. **Monthly Cost Summary**
   - Total meals served
   - Total cost
   - Cost per meal
   - Department-wise allocation
   - Per-person meal cost

3. **Item-Wise Consumption Report**
   - Opening stock
   - Receipts (quantity + value)
   - Consumption (quantity + value)
   - Closing stock
   - Variance analysis

4. **Vendor Financial Report**
   - Total purchases per vendor
   - Payments made
   - Outstanding balance
   - Payment history

5. **Inventory Audit Log**
   - All stock transactions
   - User, timestamp, type (receipt/issue)
   - Audit verification status

6. **Guest Meal Report**
   - Department-wise guest meal count
   - Approval status
   - Internal billing summary

7. **Attendance vs. Meal Consumption Report**
   - Employee-wise attendance and meal data
   - Shift-wise meal eligibility
   - Missed meal analysis

**User Stories:**
- As an Admin, I need monthly cost reports to submit to management
- As a Department Head, I need to see my department's meal consumption for budgeting
- As an Auditor, I need complete inventory transaction history

#### 4.3 Data Export

**Functional Requirements:**
- Export all reports to:
  - Excel (XLSX)
  - PDF
  - CSV
- Scheduled report generation and email delivery
- Custom date range selection
- Filter by department, shift, meal type, etc.

---

### 5. Notification System

#### 5.1 Notification Types

**Real-Time Notifications:**
- Low stock alerts
- Guest meal approval requests
- Meal commitment deadline reminders
- Daily meal consumption summary

**Notification Channels:**
- In-app notifications
- Email
- SMS (optional, for critical alerts)
- Push notifications (optional)

**Notification Rules:**

| Event | Recipient | Timing | Channel |
|-------|-----------|--------|---------|
| Low Stock Alert | Store Keeper, Canteen Manager | When stock < reorder level | In-app + Email |
| Guest Meal Request | HR/Admin | Immediately | In-app + Email |
| Meal Commitment Reminder | Department Heads | 3 PM daily (if not submitted) | In-app + Email |
| Daily Meal Summary | Department Heads | Post-lunch (2 PM) | Email |
| Purchase Order Approval | Purchase Committee | On PO creation | In-app + Email |
| Bill Payment Due | Finance Admin | 3 days before due date | Email |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│              Next.js 14 (App Router + RSC)                   │
│           shadcn/ui + Tailwind CSS + TypeScript              │
├─────────────────────────────────────────────────────────────┤
│                     API Layer                                │
│          Next.js API Routes + Server Actions                 │
│                  (RESTful + Server Components)               │
├─────────────────────────────────────────────────────────────┤
│                  Business Logic Layer                        │
│        Services, Controllers, Middleware                     │
│        Authentication (NextAuth.js with JWT)                 │
│                Role-Based Access Control                     │
├─────────────────────────────────────────────────────────────┤
│                   Data Layer                                 │
│              MongoDB + Mongoose ODM                          │
│               Redis (Caching & Real-time)                    │
├─────────────────────────────────────────────────────────────┤
│                 External Integrations                        │
│  HRMS API | Biometric Device API | Email Service | Storage  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Decisions

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend Framework** | Next.js 14 (App Router) | Server-side rendering, React Server Components, built-in API routes, optimal for enterprise apps |
| **UI Components** | shadcn/ui + Tailwind CSS | Modern, accessible, customizable component library with elegant design |
| **Language** | TypeScript | Type safety, better developer experience, reduced runtime errors |
| **Database** | MongoDB 6+ | Flexible schema for evolving requirements, horizontal scaling, good for real-time data |
| **ODM** | Mongoose | Schema validation, middleware hooks, populate/virtuals, mature ecosystem |
| **Authentication** | NextAuth.js v5 | Secure JWT-based auth, role management, session handling |
| **State Management** | React Query + Zustand | Server state caching (React Query) + client state (Zustand) |
| **Form Handling** | react-hook-form + Zod | Performance, validation schema, TypeScript support |
| **Charts/Analytics** | Recharts | React-native charts, customizable, good for dashboards |
| **Real-time** | Socket.io or Pusher | For live meal dashboard and device communication |
| **Caching** | Redis | Fast lookup for attendance data, session management |
| **File Storage** | AWS S3 or Cloudinary | Invoice documents, employee photos, reports |
| **Email Service** | Resend or SendGrid | Notification delivery |
| **Deployment** | Vercel or AWS | Next.js optimized, edge functions, scalability |

---

## User Roles & Permissions

### Role Matrix

| Module | Store Keeper | Canteen Manager | Department Head | Purchase Committee | HR/Admin |
|--------|-------------|----------------|----------------|-------------------|----------|
| **Dashboard** | View inventory | View all | View dept only | View procurement | View all |
| **Employee Management** | View | View | View dept | View | Full access |
| **Meal Planning** | View | Full access | Submit commitments | View | Full access |
| **Meal Transactions** | View | View + Export | View dept | - | View all |
| **Inventory** | Full access | View + Reports | - | View reports | View reports |
| **Procurement** | Record receipts | Create demands | - | Full approval workflow | View reports |
| **Financial Reports** | View own actions | View canteen costs | View dept costs | Full access | Full access |
| **Guest Meals** | - | View | Request | - | Approve |
| **Notifications** | Inventory alerts | All alerts | Dept alerts | Approval alerts | All alerts |
| **System Settings** | - | Meal sessions | - | Vendor settings | Full access |

### Permission Levels

**Level 1 - View Only:**
- Read access to assigned modules
- Export reports
- Receive notifications

**Level 2 - Create/Edit:**
- Level 1 permissions
- Create and edit records in assigned modules
- Submit for approval

**Level 3 - Approve:**
- Level 2 permissions
- Approve workflows (PO, guest meals, demands)
- Override system validations (with audit log)

**Level 4 - Full Admin:**
- All permissions
- User management
- System configuration
- Audit log access

---

## Module Specifications

### Module 1: Authentication & Authorization

**Features:**
- Email/password login
- JWT token-based session
- Role-based access control (RBAC)
- Password reset flow
- Session management
- Multi-device login support
- Audit logging of all user actions

**API Endpoints:**
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `POST /api/auth/refresh-token`

---

### Module 2: Employee Management

**Features:**
- Employee CRUD operations
- Bulk import from Excel/CSV
- Sync with HRMS API
- Facial data management
- Shift assignment
- Department mapping
- Employment status tracking
- Search and filter

**API Endpoints:**
- `GET /api/employees` - List with pagination
- `GET /api/employees/:id` - Single employee
- `POST /api/employees` - Create
- `PUT /api/employees/:id` - Update
- `DELETE /api/employees/:id` - Soft delete
- `POST /api/employees/sync-hrms` - Sync from HRMS
- `POST /api/employees/sync-biometric` - Sync facial data
- `POST /api/employees/bulk-import` - Excel upload

**Database Collections:**
- `employees`
- `shifts`
- `departments`
- `biometric_templates`

---

### Module 3: Meal Management

**Features:**
- Meal session configuration
- Daily meal commitments
- Real-time meal verification
- Guest meal requests
- Meal transaction logging
- Live dashboard
- Historical tracking

**Sub-modules:**

#### 3.1 Meal Sessions
- Configure meal sessions (name, start time, end time, eligible shifts)
- Enable/disable sessions
- Set cutoff times

#### 3.2 Meal Commitments
- Department-wise daily commitments
- Bulk upload support
- Reminder notifications
- Commitment vs. actual reporting

#### 3.3 Meal Transactions
- Face verification logging
- Real-time eligibility check
- Transaction history
- Disputed transactions
- Manual meal entry (with approval)

#### 3.4 Guest Meals
- Request workflow
- Approval routing
- Guest registration
- Billing tracking

**API Endpoints:**
- `GET /api/meals/sessions` - List sessions
- `POST /api/meals/sessions` - Create session
- `GET /api/meals/commitments` - List commitments
- `POST /api/meals/commitments` - Submit commitment
- `POST /api/meals/transactions` - Log meal (from device)
- `GET /api/meals/transactions` - Query transactions
- `POST /api/meals/verify-eligibility` - Check eligibility
- `POST /api/meals/guest-requests` - Create guest request
- `PUT /api/meals/guest-requests/:id/approve` - Approve

**Database Collections:**
- `meal_sessions`
- `meal_commitments`
- `meal_transactions`
- `guest_meals`
- `meal_eligibility_cache`

---

### Module 4: Inventory Management

**Features:**
- Item master management
- Stock receipt recording
- Stock issuance tracking
- Stock reconciliation
- Real-time balance calculation
- Low stock alerts
- Stock movement history
- Valuation (FIFO/Weighted Average)

**Sub-modules:**

#### 4.1 Item Master
- Item CRUD
- Categories and units
- Reorder levels
- Expiry tracking
- Vendor mapping

#### 4.2 Stock Receipts
- Receipt entry against PO
- Invoice reference
- Quality check status
- Auto-update inventory

#### 4.3 Stock Issuance
- Daily consumption entry
- Meal session linkage
- Purpose tracking
- Auto-deduction

#### 4.4 Stock Reconciliation
- Opening stock entry
- Physical count entry
- Variance calculation
- Adjustment approval

**API Endpoints:**
- `GET /api/inventory/items` - List items
- `POST /api/inventory/items` - Create item
- `GET /api/inventory/items/:id/balance` - Current balance
- `POST /api/inventory/receipts` - Record receipt
- `POST /api/inventory/issuance` - Record issuance
- `POST /api/inventory/reconciliation` - Submit reconciliation
- `GET /api/inventory/movements` - Movement history
- `GET /api/inventory/alerts` - Low stock items

**Database Collections:**
- `inventory_items`
- `inventory_categories`
- `stock_receipts`
- `stock_issuance`
- `stock_reconciliation`
- `stock_movements`

---

### Module 5: Procurement & Financials

**Features:**
- Vendor management
- Demand list generation
- Purchase order workflow
- PO approval routing
- Bill/invoice entry
- Payment tracking
- Vendor ledger
- Purchase analytics

**Sub-modules:**

#### 5.1 Vendor Management
- Vendor CRUD
- Contact management
- Item mapping
- Performance tracking
- Payment terms

#### 5.2 Demand Planning
- Auto-generation from commitments
- Manual demand creation
- Item-wise quantities
- Approval workflow

#### 5.3 Purchase Orders
- PO creation from demands
- Vendor selection
- Approval routing
- PO tracking
- Fulfillment status

#### 5.4 Bills & Payments
- Bill entry
- Excel import
- Payment recording
- Outstanding tracking
- Vendor statements

**API Endpoints:**
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `POST /api/procurement/demands` - Create demand
- `GET /api/procurement/demands/:id` - Get demand
- `PUT /api/procurement/demands/:id/approve` - Approve
- `POST /api/procurement/purchase-orders` - Create PO
- `GET /api/procurement/purchase-orders/:id` - Get PO
- `POST /api/procurement/bills` - Record bill
- `POST /api/procurement/payments` - Record payment
- `GET /api/procurement/vendor-ledger/:vendorId` - Ledger

**Database Collections:**
- `vendors`
- `demand_lists`
- `purchase_orders`
- `bills`
- `payments`
- `vendor_ledger`

---

### Module 6: Reporting & Analytics

**Features:**
- Pre-built report templates
- Custom report builder
- Real-time dashboards
- Data visualization (charts)
- Export to Excel/PDF
- Scheduled reports
- Email delivery

**Report Categories:**

#### 6.1 Operational Reports
- Daily meal summary
- Meal variance report
- Session-wise consumption
- Department-wise analysis

#### 6.2 Financial Reports
- Monthly cost summary
- Cost per meal
- Vendor spend analysis
- Payment status report

#### 6.3 Inventory Reports
- Item-wise consumption
- Stock status report
- Stock movement register
- Reconciliation report
- Wastage analysis

#### 6.4 Compliance & Audit Reports
- Transaction audit log
- User activity log
- Approval workflow status
- Attendance vs. meal reconciliation

**API Endpoints:**
- `GET /api/reports/meal-summary` - Meal reports
- `GET /api/reports/financial-summary` - Financial reports
- `GET /api/reports/inventory-status` - Inventory reports
- `GET /api/reports/audit-log` - Audit reports
- `POST /api/reports/export` - Export report
- `POST /api/reports/schedule` - Schedule report
- `GET /api/dashboards/overview` - Main dashboard data
- `GET /api/dashboards/real-time-meals` - Live meal data

**Database Collections:**
- `report_schedules`
- `report_exports`
- `audit_logs`

---

### Module 7: Notification System

**Features:**
- Multi-channel notifications (in-app, email, SMS)
- Role-based notification routing
- Notification preferences
- Delivery status tracking
- Template management
- Scheduled notifications

**Notification Types:**
- Alerts (low stock, system errors)
- Approvals (PO, guest meals, demands)
- Reminders (meal commitments, payment due)
- Reports (daily summaries, monthly reports)

**API Endpoints:**
- `GET /api/notifications` - List user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update preferences

**Database Collections:**
- `notifications`
- `notification_templates`
- `notification_preferences`

---

### Module 8: Integration Services

**Features:**
- HRMS integration
- Biometric device integration
- Email service integration
- SMS gateway integration
- Cloud storage integration

**Sub-modules:**

#### 8.1 HRMS Integration
- Employee data sync
- Attendance data sync
- Shift schedule sync
- OT data sync

#### 8.2 Biometric Integration
- Facial template sync
- Device callback handler
- Device status monitoring

**API Endpoints:**
- `POST /api/integrations/hrms/sync` - Trigger HRMS sync
- `POST /api/integrations/biometric/sync` - Sync biometric data
- `POST /api/integrations/devices/callback` - Device callback
- `GET /api/integrations/devices/status` - Device status

**Database Collections:**
- `integration_logs`
- `sync_status`
- `devices`

---

## Integration Requirements

### 1. HRMS Integration

**Purpose:** Sync employee, attendance, and shift data

**Integration Type:** REST API (bidirectional)

**Data Sync Frequency:**
- Employee master: Daily at 2 AM
- Attendance data: Every 15 minutes
- Shift schedules: Daily at 12 AM

**API Requirements:**

**From HRMS → ACIMS:**
```json
GET /hrms/api/employees
Response: {
  "employees": [
    {
      "employeeId": "EMP001",
      "name": "John Doe",
      "department": "Production",
      "shift": "Day",
      "employmentType": "Permanent",
      "status": "Active",
      "joiningDate": "2020-01-15"
    }
  ]
}

GET /hrms/api/attendance?date=2024-01-15
Response: {
  "attendance": [
    {
      "employeeId": "EMP001",
      "date": "2024-01-15",
      "shift": "Day",
      "status": "Present",
      "checkIn": "08:00:00",
      "checkOut": "17:00:00",
      "otHours": 2
    }
  ]
}
```

**Authentication:** API Key + OAuth 2.0

**Error Handling:**
- Retry mechanism (3 attempts)
- Fallback to cached data
- Alert admin on sync failure

---

### 2. Biometric Device Integration

**Purpose:** Sync facial templates and receive meal verification callbacks

**Device Type:** ZKTeco or compatible facial recognition devices

**Integration Type:**
- REST API for facial data sync
- Webhook/callback for real-time verification

**Sync Process:**
1. ACIMS pushes employee facial templates to devices
2. Devices store templates locally
3. On face scan, device sends callback to ACIMS
4. ACIMS validates eligibility and responds

**API Requirements:**

**ACIMS → Device (Push facial data):**
```json
POST /device/api/employees/sync
Request: {
  "employees": [
    {
      "employeeId": "EMP001",
      "name": "John Doe",
      "faceTemplate": "<base64_encoded_template>",
      "photo": "<base64_encoded_photo>"
    }
  ]
}
```

**Device → ACIMS (Verification callback):**
```json
POST /api/integrations/devices/callback
Request: {
  "deviceId": "GATE001",
  "employeeId": "EMP001",
  "timestamp": "2024-01-15T12:30:45Z",
  "matchConfidence": 98.5
}

Response: {
  "eligible": true,
  "employeeName": "John Doe",
  "department": "Production",
  "mealSession": "Lunch",
  "message": "Meal Authorized",
  "displayColor": "green"
}
```

**Performance Requirements:**
- Callback response time < 500ms
- Device must handle 100 verifications/minute
- Offline mode: Store transactions locally, sync when online

---

### 3. Email Service Integration

**Purpose:** Send notifications and reports

**Service:** Resend, SendGrid, or AWS SES

**Email Types:**
- Transactional (password reset, approvals)
- Alerts (low stock, system issues)
- Reports (daily summary, monthly reports)

**Templates:**
- Welcome email
- Password reset
- Low stock alert
- Guest meal approval request
- Daily meal summary
- Monthly cost report

---

### 4. Cloud Storage Integration

**Purpose:** Store documents and exports

**Service:** AWS S3, Google Cloud Storage, or Cloudinary

**Stored Files:**
- Employee photos
- Vendor invoices
- Purchase orders
- Report exports (PDF, Excel)
- Uploaded meal commitments

---

## Non-Functional Requirements

### 1. Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time | < 2 seconds | Lighthouse score > 90 |
| API response time | < 300ms (95th percentile) | APM monitoring |
| Face verification latency | < 500ms | Device callback logs |
| Database query time | < 100ms | MongoDB profiling |
| Concurrent users | 500+ users | Load testing |
| Meal verification throughput | 100 verifications/minute per device | Device logs |

**Optimization Strategies:**
- Server-side rendering with Next.js
- Redis caching for attendance data
- Database indexing on frequently queried fields
- CDN for static assets
- Image optimization with next/image
- Code splitting and lazy loading

---

### 2. Scalability

**Current Scale:**
- 3,500 employees
- 9 meal sessions/day
- ~2,000 meal transactions/session
- ~18,000 meal transactions/day

**Target Scale (3 years):**
- 5,000+ employees
- 10 meal sessions/day
- ~25,000 meal transactions/day

**Scaling Strategy:**
- Horizontal scaling with load balancer
- MongoDB sharding for large collections
- Redis cluster for distributed caching
- Microservices architecture for device communication
- Auto-scaling on cloud platform (Vercel, AWS)

---

### 3. Security

**Authentication & Authorization:**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Session timeout (30 minutes idle)
- Multi-device session management

**Data Security:**
- HTTPS for all API communication
- API key authentication for external integrations
- Encryption at rest (MongoDB encryption)
- Sensitive data masking in logs
- Regular security audits

**Compliance:**
- GDPR compliance for employee data
- Data retention policy (5+ years)
- Audit logging of all critical actions
- Data backup and disaster recovery

---

### 4. Reliability & Availability

**Uptime Target:** 99.5% (excluding planned maintenance)

**Backup Strategy:**
- Daily automated MongoDB backups
- Backup retention: 30 days
- Point-in-time recovery capability

**Disaster Recovery:**
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour

**Monitoring:**
- Application performance monitoring (APM)
- Database performance monitoring
- Error tracking (Sentry, Bugsnag)
- Uptime monitoring
- Device connectivity monitoring

---

### 5. Maintainability

**Code Quality:**
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Husky for pre-commit hooks
- Unit tests (Jest)
- Integration tests (Playwright)
- Code coverage > 70%

**Documentation:**
- API documentation (Swagger/OpenAPI)
- Database schema documentation
- User manuals per role
- Developer setup guide
- Deployment guide

**Version Control:**
- Git-based workflow
- Feature branching
- Pull request reviews
- Semantic versioning

---

### 6. Usability

**Design Principles:**
- Mobile-responsive design
- Accessible (WCAG 2.1 Level AA)
- Consistent UI/UX across modules
- Clear visual hierarchy
- Intuitive navigation

**User Experience:**
- Loading states (skeletons)
- Optimistic UI updates
- Toast notifications for actions
- Confirmation dialogs for destructive actions
- Empty states with clear CTAs
- Search and filter capabilities

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Deliverables:**
- [ ] Project setup (Next.js 14 + TypeScript + Tailwind)
- [ ] MongoDB + Mongoose setup
- [ ] Authentication system (NextAuth.js)
- [ ] Role-based access control
- [ ] Base layout and navigation
- [ ] User management module
- [ ] Department and shift management

**Team Focus:**
- Setup development environment
- Database schema design
- UI component library setup (shadcn/ui)

---

### Phase 2: Employee & HRMS Integration (Weeks 4-6)

**Deliverables:**
- [ ] Employee management CRUD
- [ ] HRMS integration API
- [ ] Attendance sync mechanism
- [ ] Shift management
- [ ] Biometric template management
- [ ] Employee dashboard

**Team Focus:**
- Integration with existing HRMS
- Data migration from Excel
- API testing

---

### Phase 3: Meal Management Core (Weeks 7-10)

**Deliverables:**
- [ ] Meal session configuration
- [ ] Meal commitment workflow
- [ ] Eligibility validation logic
- [ ] Guest meal request workflow
- [ ] Meal transaction logging
- [ ] Real-time meal dashboard

**Team Focus:**
- Complex business logic implementation
- Real-time updates with WebSocket
- Performance optimization

---

### Phase 4: Biometric Device Integration (Weeks 11-13)

**Deliverables:**
- [ ] Device registration and management
- [ ] Facial template sync to devices
- [ ] Device callback handler
- [ ] Real-time verification flow
- [ ] Device monitoring dashboard
- [ ] Visual feedback system (display screens)

**Team Focus:**
- Hardware integration testing
- Low-latency optimization
- Offline mode handling

---

### Phase 5: Inventory Management (Weeks 14-17)

**Deliverables:**
- [ ] Item master management
- [ ] Stock receipt workflow
- [ ] Stock issuance workflow
- [ ] Stock reconciliation
- [ ] Inventory dashboard
- [ ] Low stock alerts
- [ ] Stock movement history

**Team Focus:**
- Inventory valuation logic
- Real-time balance calculation
- Alert system

---

### Phase 6: Procurement & Financial (Weeks 18-21)

**Deliverables:**
- [ ] Vendor management
- [ ] Demand generation (auto + manual)
- [ ] Purchase order workflow
- [ ] Approval routing
- [ ] Bill entry and Excel import
- [ ] Payment tracking
- [ ] Vendor ledger

**Team Focus:**
- Approval workflow implementation
- Financial calculations
- Excel import functionality

---

### Phase 7: Reporting & Analytics (Weeks 22-25)

**Deliverables:**
- [ ] Report templates (all 7 reports)
- [ ] Dashboard visualizations (Recharts)
- [ ] Export functionality (Excel, PDF)
- [ ] Scheduled reports
- [ ] Email delivery
- [ ] Custom report builder

**Team Focus:**
- Complex data aggregations
- Performance optimization for large datasets
- Export generation

---

### Phase 8: Notifications & Final Integration (Weeks 26-28)

**Deliverables:**
- [ ] Notification system (in-app + email)
- [ ] Notification preferences
- [ ] All integration testing
- [ ] Performance tuning
- [ ] Security audit
- [ ] User acceptance testing (UAT)

**Team Focus:**
- End-to-end testing
- Bug fixes
- Performance optimization

---

### Phase 9: Deployment & Training (Weeks 29-30)

**Deliverables:**
- [ ] Production deployment
- [ ] User training materials
- [ ] Admin training
- [ ] Device installation and configuration
- [ ] Data migration from Excel
- [ ] Go-live support

**Team Focus:**
- Deployment
- User training
- Post-launch support

---

## Success Criteria

### Technical Success Metrics
- [ ] Face verification latency < 500ms (99th percentile)
- [ ] System uptime > 99.5%
- [ ] Support 3,500+ employees
- [ ] Handle 18,000+ meal transactions/day
- [ ] Page load time < 2 seconds
- [ ] Zero unauthorized meal distribution
- [ ] API response time < 300ms (95th percentile)

### Business Success Metrics
- [ ] 100% meal tracking automation
- [ ] Eliminate manual Excel entry
- [ ] Reduce meal wastage by 20%
- [ ] 90% user satisfaction score
- [ ] Complete audit trail for all transactions
- [ ] Real-time financial visibility
- [ ] Monthly cost reporting < 2 hours (previously 2 days)

### User Adoption Metrics
- [ ] 95% daily active usage
- [ ] < 5% support tickets per user per month
- [ ] 80% of users proficient within 1 week
- [ ] < 2 minute average meal verification time

---

## Risk Management

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| HRMS API downtime | High | Medium | Cache attendance data, fallback mechanism |
| Device connectivity issues | High | Medium | Offline mode, local storage, sync on reconnect |
| Database performance degradation | High | Low | Indexing, query optimization, Redis caching |
| Integration API changes | Medium | Medium | API versioning, abstraction layer |
| Peak load handling (meal times) | High | Medium | Load testing, auto-scaling, caching |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User resistance to face scanning | Medium | Medium | Training, privacy policy, phased rollout |
| Data migration errors | High | Medium | Validation scripts, dry runs, rollback plan |
| Vendor delays (hardware) | Medium | Low | Early procurement, backup vendors |
| Insufficient training | Medium | Medium | Comprehensive training program, video tutorials |

---

## Appendix

### A. Meal Session Configuration Example

| Session Name | Start Time | End Time | Eligible Shifts | Default Enabled |
|-------------|-----------|----------|-----------------|-----------------|
| Early Morning Tea | 05:00 | 06:00 | Night | Yes |
| Breakfast | 07:00 | 09:00 | Day, Evening | Yes |
| Morning Snack | 10:00 | 11:00 | Day | No |
| Lunch | 12:00 | 14:00 | Day | Yes |
| Afternoon Snack | 15:00 | 16:00 | Day | No |
| Dinner | 18:00 | 20:00 | Evening, Night | Yes |
| Evening Snack | 21:00 | 22:00 | Night | No |
| Midnight Tea | 00:00 | 01:00 | Night (OT) | Yes |
| Late Night Meal | 02:00 | 03:00 | Night (OT) | No |

### B. Inventory Item Categories

- Vegetables
- Fruits
- Rice & Grains
- Pulses & Lentils
- Spices & Condiments
- Dairy Products
- Meat & Poultry
- Fish & Seafood
- Cooking Oil & Ghee
- Dry Goods
- Beverages
- Snacks
- Cleaning Supplies
- Disposables

### C. Department Examples

- Production
- Quality Control
- Maintenance
- Packaging
- Warehouse
- Admin
- HR
- Finance
- IT
- Security
- Sales & Marketing
- R&D

### D. Sample Shift Configurations

| Shift Name | Start Time | End Time | Meal Eligibility |
|-----------|-----------|----------|------------------|
| Day Shift | 08:00 | 17:00 | Breakfast, Lunch, Afternoon Snack |
| Evening Shift | 16:00 | 01:00 | Dinner, Evening Snack |
| Night Shift | 00:00 | 09:00 | Early Morning Tea, Breakfast, Midnight Tea |
| General (8 AM) | 08:00 | 17:00 | Lunch, Afternoon Snack |

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Next Review:** Before Phase 1 kickoff
