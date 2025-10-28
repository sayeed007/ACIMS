# 🚀 ACIMS Setup Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB running (local or cloud)
- Git installed

## 1. Environment Setup

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/acims
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acims

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Seed the Database

This will populate the database with sample data:

```bash
npm run seed
```

**Expected Output:**
```
🌱 Starting database seed...
🗑️  Clearing existing data...
👤 Creating admin user...
🏢 Creating departments...
⏰ Creating shifts...
👥 Creating employees...
🍽️  Creating meal sessions...
🏪 Creating vendors...
📦 Creating inventory items...
📊 Creating stock movements...
🔍 Creating reconciliations...
✅ Seed completed successfully!

📝 Login Credentials:
   Email: admin@acims.com
   Password: admin123

📊 Created:
   - 4 Departments
   - 3 Shifts
   - 3 Employees
   - 3 Meal Sessions
   - 3 Vendors
   - 7 Inventory Items
   - 3 Stock Movements
   - 1 Reconciliations
```

## 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 5. Login to the Application

Use these credentials:
- **Email:** admin@acims.com
- **Password:** admin123

## 6. Explore the Features

### ✅ Completed Modules (53% - 8/15 pages)

#### HR & Attendance (100% Complete)
- `/employees` - Manage employees
- `/departments` - Manage departments
- `/shifts` - Manage work shifts
- `/meal-sessions` - Manage meal sessions

#### Inventory (100% Complete)
- `/inventory/items` - Inventory items management
- `/inventory/movements` - Stock movements tracking
- `/inventory/reconciliations` - Stock reconciliation

#### Procurement (25% Complete)
- `/procurement/vendors` - Vendor management

## 7. Sample Data Overview

### Departments
- Kitchen (KIT)
- Service (SRV)
- Store (STR)
- Administration (ADM)

### Employees
- Rajesh Kumar (Head Chef)
- Priya Sharma (Service Manager)
- Amit Patel (Store Keeper)

### Meal Sessions
- Breakfast (07:00 - 09:00)
- Lunch (12:00 - 14:00)
- Dinner (19:00 - 21:00)

### Vendors
- Fresh Foods Pvt Ltd (Food)
- Spice King Traders (Ingredients)
- Packaging Solutions Ltd (Packaging)

### Inventory Items
- Basmati Rice (500 kg)
- Sunflower Oil (150 liters)
- Onions (75 kg)
- Tomatoes (60 kg)
- Turmeric Powder (20 kg)
- Red Chili Powder (15 kg)
- Toor Dal (120 kg)

## 8. Testing the Application

### Test Inventory Management
1. Go to `/inventory/items`
2. View the list of items with their stock levels
3. Click "Add Item" to create a new inventory item
4. Edit existing items to update stock information

### Test Stock Movements
1. Go to `/inventory/movements`
2. View stock movement history
3. Click "Record Movement" to add a new stock transaction
4. Select movement type (IN, OUT, ADJUSTMENT, TRANSFER, RETURN)
5. Watch automatic stock updates

### Test Reconciliation
1. Go to `/inventory/reconciliations`
2. Click "New Reconciliation"
3. Select an item and enter physical stock count
4. See automatic discrepancy calculation
5. Enable "Auto-adjust stock level" to create automatic adjustment

### Test Vendor Management
1. Go to `/procurement/vendors`
2. View vendor list with categories and ratings
3. Click "Add Vendor" to create a new vendor
4. Fill in the 4-tab form (Basic Info, Contact, Business, Payment)
5. Edit vendor ratings and status

## 9. Troubleshooting

### Database Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Or check MongoDB service status
# Windows: services.msc (look for MongoDB)
# Linux/Mac: sudo systemctl status mongod
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

### Clear Database and Reseed
```bash
# Run seed script again (it will clear existing data first)
npm run seed
```

## 10. Next Steps

### Remaining Features to Implement
- Purchase Demands (Purchase Requisitions)
- Purchase Orders
- Bills Management
- Reports Module
- Settings Module

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** MongoDB with Mongoose
- **State Management:** React Query (@tanstack/react-query)
- **UI Components:** Shadcn/ui (Radix UI)
- **Forms:** React Hook Form
- **Authentication:** JWT
- **Styling:** Tailwind CSS

## 11. Project Structure

```
FoodManagement/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── inventory/       # Inventory endpoints
│   │   └── procurement/     # Procurement endpoints
│   ├── employees/           # Employee management
│   ├── departments/         # Department management
│   ├── inventory/           # Inventory pages
│   └── procurement/         # Procurement pages
├── components/              # React components
│   ├── ui/                  # Shadcn UI components
│   ├── layout/              # Layout components
│   ├── inventory/           # Inventory-specific components
│   └── procurement/         # Procurement-specific components
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries
│   ├── db/                  # Database connection & models
│   │   ├── models/         # Mongoose models
│   │   └── seed.ts         # Database seeding script
│   ├── providers/          # React context providers
│   └── utils/              # Helper functions
├── docs/                    # Documentation
└── public/                  # Static assets
```

## 12. API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Inventory
- `GET/POST /api/inventory/items` - List/Create items
- `GET/PUT/DELETE /api/inventory/items/:id` - Single item operations
- `GET/POST /api/inventory/movements` - List/Create movements
- `GET/POST /api/inventory/reconciliations` - List/Create reconciliations

### Procurement
- `GET/POST /api/procurement/vendors` - List/Create vendors
- `GET/PUT/DELETE /api/procurement/vendors/:id` - Single vendor operations

## 13. Support

For issues or questions:
1. Check the documentation in `/docs`
2. Review error logs in the console
3. Check MongoDB connection status
4. Ensure all environment variables are set

---

**Last Updated:** October 2025
**Version:** 1.0.0
**Completion:** 53% (8/15 features)
