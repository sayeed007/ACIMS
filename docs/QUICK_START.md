# ACIMS - Quick Start Guide

## 🎉 Backend Setup Complete!

Your Next.js 14 + MongoDB backend is ready to use!

---

## ⚡ Quick Start (3 Steps)

### 1. Start MongoDB
```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# OR use MongoDB Atlas (cloud) - get connection string from:
# https://www.mongodb.com/cloud/atlas
```

### 2. Configure Environment
```bash
# Edit .env.local with your MongoDB URI
MONGODB_URI=mongodb://localhost:27017/acims
NEXTAUTH_SECRET=your-secret-key-change-this-min-32-chars
JWT_SECRET=your-jwt-secret-key
```

### 3. Run the Server
```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## 🧪 Test Your Setup

### Quick API Test
```bash
# 1. Register admin user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acims.com","password":"admin123","name":"Admin","role":"ADMIN"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acims.com","password":"admin123"}'

# Copy the token from response and use it:

# 3. Get current user (replace YOUR_TOKEN)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📦 What's Included

### ✅ Database & Models
- MongoDB + Mongoose setup with 11 core models
- User, Employee, Department, Shift, MealSession, MealTransaction
- InventoryItem, Vendor, Notification, AuditLog, Device

### ✅ API Routes (15+ endpoints)
- **Auth:** `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Employees:** `/api/employees` (GET, POST, PUT, DELETE)
- **Departments:** `/api/departments` (GET, POST)
- **Shifts:** `/api/shifts` (GET, POST)
- **Meal Sessions:** `/api/meals/sessions` (GET, POST)

### ✅ Utilities
- API response helpers (success, error responses)
- Authentication helpers (JWT, auth middleware)
- Redis cache support (optional)

### ✅ Features
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Pagination support
- Soft deletes
- Audit logging ready
- TypeScript support

---

## 📁 Key Files

```
├── app/api/                 # API routes
├── lib/db/models/           # Mongoose models
├── lib/utils/               # Helper functions
├── .env.local               # Your config
├── BACKEND_SETUP.md         # Detailed docs
└── QUICK_START.md           # This file
```

---

## 🚀 Next Steps

1. **Test the APIs** - Use the curl commands above
2. **Connect UI** - Your existing UI pages can now connect to these APIs
3. **Add More Routes** - Build remaining endpoints as needed
4. **Deploy** - When ready, deploy to Vercel or AWS

---

## 📚 Documentation

- **Full Setup Guide:** `BACKEND_SETUP.md`
- **Technical Requirements:** `docs/TECHNICAL_REQUIREMENTS_BREAKDOWN.md`
- **Schema Documentation:** `docs/MONGODB_SCHEMAS.md`
- **Tech Stack:** `docs/TECH_STACK_SPECIFICATIONS.md`

---

## 🆘 Need Help?

### Common Issues

**MongoDB not connecting?**
```bash
# Check if MongoDB is running
mongosh
# or
docker ps | grep mongo
```

**Port 3000 in use?**
```bash
# Use different port
npm run dev -- -p 3001
```

**Authentication not working?**
- Check if `JWT_SECRET` is set in `.env.local`
- Verify token format: `Authorization: Bearer <token>`

---

## ✨ Features to Build Next

Priority order:
1. ✅ Authentication (Done!)
2. ✅ Employee Management (Done!)
3. ⏳ Meal Transaction logging (for biometric devices)
4. ⏳ Inventory management
5. ⏳ Procurement workflows
6. ⏳ Reports and analytics

---

**You're all set! Start building! 🎯**
