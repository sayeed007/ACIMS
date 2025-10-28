# ACIMS Backend Setup Guide

## ✅ Completed Setup

Congratulations! The backend for the Automated Canteen & Inventory Management System (ACIMS) is now set up and ready to use.

---

## 📋 What's Been Set Up

### 1. **Next.js 14 with App Router**
- ✅ Upgraded to Next.js 14 (latest version)
- ✅ React 18+ with Server Components
- ✅ TypeScript configuration
- ✅ App Router structure with API routes

### 2. **Database Configuration**
- ✅ MongoDB connection with Mongoose ODM
- ✅ Redis client for caching (optional)
- ✅ Connection pooling and error handling
- ✅ Hot-reload support for development

### 3. **Mongoose Models (Core Schemas)**
Created 11 core Mongoose models with full TypeScript support:

- **Authentication & Users:**
  - `User` - User accounts with RBAC
  - `Session` - JWT session management

- **Employee Management:**
  - `Department` - Organization departments
  - `Shift` - Work shifts configuration
  - `Employee` - Employee records
  - `EmployeeAttendance` - Attendance tracking (cached from HRMS)

- **Meal Management:**
  - `MealSession` - Meal sessions (Breakfast, Lunch, etc.)
  - `MealTransaction` - Meal verification logs

- **Inventory:**
  - `InventoryItem` - Inventory items with stock tracking

- **Procurement:**
  - `Vendor` - Vendor management

- **System:**
  - `Notification` - Multi-channel notifications
  - `AuditLog` - Audit trail for compliance
  - `Device` - Biometric device management

### 4. **API Routes Created**

#### **Authentication APIs** (`/api/auth/`)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

#### **Employee Management APIs** (`/api/employees/`)
- `GET /api/employees` - List employees (with pagination & filters)
- `POST /api/employees` - Create employee
- `GET /api/employees/[id]` - Get single employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Soft delete employee

#### **Department APIs** (`/api/departments/`)
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create department

#### **Shift APIs** (`/api/shifts/`)
- `GET /api/shifts` - List all shifts
- `POST /api/shifts` - Create shift

#### **Meal Session APIs** (`/api/meals/sessions/`)
- `GET /api/meals/sessions` - List meal sessions
- `POST /api/meals/sessions` - Create meal session

### 5. **Utility Functions**

#### **API Response Helpers** (`lib/utils/api-response.ts`)
- `successResponse()` - 200 OK responses
- `createdResponse()` - 201 Created responses
- `validationError()` - 400 Validation errors
- `unauthorizedError()` - 401 Unauthorized
- `forbiddenError()` - 403 Forbidden
- `notFoundError()` - 404 Not Found
- `conflictError()` - 409 Conflict
- `internalServerError()` - 500 Internal errors
- `getPaginationParams()` - Extract pagination from request
- `getPaginationMeta()` - Generate pagination metadata

#### **Authentication Helpers** (`lib/utils/auth-helpers.ts`)
- `generateToken()` - Create JWT access token
- `generateRefreshToken()` - Create refresh token
- `verifyToken()` - Verify JWT token
- `getCurrentUser()` - Get authenticated user from request
- `requireAuth()` - Require authentication middleware
- `hasRole()` - Check user role
- `hasPermission()` - Check user permission
- `requireRole()` - Require specific role

### 6. **Environment Configuration**
- ✅ `.env.example` - Template with all variables
- ✅ `.env.local` - Development environment setup

---

## 🚀 How to Start

### Step 1: Install Dependencies (Already Done!)
```bash
npm install
```

### Step 2: Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Update .env.local
MONGODB_URI=mongodb://localhost:27017/acims
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acims?retryWrites=true&w=majority
```

### Step 3: Configure Environment Variables

Edit `.env.local` file:
```env
# Required
MONGODB_URI=mongodb://localhost:27017/acims
NEXTAUTH_SECRET=your-secret-key-min-32-characters
JWT_SECRET=your-jwt-secret-key

# Optional (for advanced features)
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=your-resend-api-key
AWS_S3_BUCKET=your-bucket-name
```

### Step 4: Run Development Server
```bash
npm run dev
```

The server will start at `http://localhost:3000`

---

## 🧪 Testing the API

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acims.com",
    "password": "password123",
    "name": "Admin User",
    "role": "ADMIN"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "admin@acims.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acims.com",
    "password": "password123"
  }'
```

### 3. Get Current User (Protected Route)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create a Department
```bash
curl -X POST http://localhost:3000/api/departments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production",
    "code": "PROD",
    "description": "Production Department"
  }'
```

### 5. Create a Shift
```bash
curl -X POST http://localhost:3000/api/shifts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Day Shift",
    "code": "DAY",
    "startTime": "08:00",
    "endTime": "17:00"
  }'
```

### 6. Create an Employee
```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "name": "John Doe",
    "email": "john@company.com",
    "departmentId": "DEPARTMENT_ID_FROM_STEP_4",
    "departmentName": "Production",
    "shiftId": "SHIFT_ID_FROM_STEP_5",
    "shiftName": "Day Shift",
    "employmentType": "PERMANENT",
    "designation": "Operator",
    "joiningDate": "2024-01-15",
    "hrmsSystemType": "PERMANENT_HRMS",
    "hrmsExternalId": "EMP001"
  }'
```

---

## 📁 Project Structure

```
FoodManagement/
├── app/
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── me/route.ts
│   │   ├── employees/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── departments/route.ts
│   │   ├── shifts/route.ts
│   │   └── meals/
│   │       └── sessions/route.ts
│   └── (existing UI pages)
│
├── lib/
│   ├── db/
│   │   ├── mongoose.ts           # MongoDB connection
│   │   ├── redis.ts              # Redis client (optional)
│   │   └── models/               # Mongoose models
│   │       ├── index.ts          # Model exports
│   │       ├── User.ts
│   │       ├── Employee.ts
│   │       ├── Department.ts
│   │       ├── Shift.ts
│   │       ├── MealSession.ts
│   │       ├── MealTransaction.ts
│   │       ├── InventoryItem.ts
│   │       ├── Vendor.ts
│   │       ├── Notification.ts
│   │       ├── AuditLog.ts
│   │       └── Device.ts
│   └── utils/
│       ├── api-response.ts       # API response helpers
│       └── auth-helpers.ts       # Auth utilities
│
├── docs/                          # Documentation
│   ├── TECHNICAL_REQUIREMENTS_BREAKDOWN.md
│   ├── TECH_STACK_SPECIFICATIONS.md
│   └── MONGODB_SCHEMAS.md
│
├── .env.example                   # Environment template
├── .env.local                     # Your environment config
├── package.json
└── BACKEND_SETUP.md              # This file
```

---

## 🔐 Authentication Flow

1. **Register/Login** → Get JWT token
2. **Include token** in Authorization header for all protected routes
3. **Token format:** `Authorization: Bearer <token>`
4. **Token expiry:** 30 minutes (access token), 7 days (refresh token)

---

## 🎯 Next Steps

### Immediate (Critical)
1. ✅ Test all authentication endpoints
2. ✅ Create initial admin user
3. ✅ Test employee creation workflow
4. ⏳ Create remaining API routes:
   - Meal Transactions (device callback)
   - Meal Commitments
   - Inventory Items (CRUD)
   - Stock Receipts & Issuance
   - Procurement (Vendors, PO, Bills)

### Short-term
1. ⏳ Implement HRMS integration service
2. ⏳ Implement biometric device integration
3. ⏳ Add validation schemas with Zod
4. ⏳ Create service layer for business logic
5. ⏳ Add error logging (Sentry integration)

### Medium-term
1. ⏳ Implement real-time updates (Socket.io)
2. ⏳ Add email notifications (Resend)
3. ⏳ Implement file upload (AWS S3)
4. ⏳ Create scheduled jobs (cron)
5. ⏳ Add API rate limiting

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Or for Docker:
docker ps | grep mongo
```

### Port Already in Use
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors
```bash
npm run typecheck
```

---

## 📚 Documentation References

- **Full Technical Requirements:** `docs/TECHNICAL_REQUIREMENTS_BREAKDOWN.md`
- **Tech Stack Details:** `docs/TECH_STACK_SPECIFICATIONS.md`
- **Complete Schema Documentation:** `docs/MONGODB_SCHEMAS.md`
- **Next.js 14 Docs:** https://nextjs.org/docs
- **Mongoose Docs:** https://mongoosejs.com/docs/

---

## 🤝 API Response Format

All API responses follow this standard format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { /* optional error details */ }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🎉 You're All Set!

The backend is now ready for development. You can:
1. Test the APIs using the examples above
2. Connect your existing UI to the backend
3. Continue building additional API routes
4. Implement the remaining schemas from the documentation

**Happy Coding! 🚀**
