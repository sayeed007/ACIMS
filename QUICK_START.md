# ⚡ Quick Start Guide

## 🎯 Get Up and Running in 5 Minutes

### Step 1: Environment Variables
Create `.env.local` in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/acims
JWT_SECRET=your-secret-key-change-this
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Install & Seed

```bash
# Install dependencies
npm install

# Seed the database with sample data
npm run seed
```

### Step 3: Run the Application

```bash
npm run dev
```

Visit: `http://localhost:3000`

### Step 4: Login

```
Email: admin@acims.com
Password: admin123
```

---

## ✅ What's Working

### Fully Functional Features (8/15 - 53%)

1. **Employees** - `/employees`
2. **Departments** - `/departments`
3. **Shifts** - `/shifts`
4. **Meal Sessions** - `/meal-sessions`
5. **Inventory Items** - `/inventory/items`
6. **Stock Movements** - `/inventory/movements`
7. **Stock Reconciliation** - `/inventory/reconciliations`
8. **Vendors** - `/procurement/vendors`

### Sample Data Included

- **4 Departments** (Kitchen, Service, Store, Administration)
- **3 Shifts** (Morning, Evening, Night)
- **3 Employees** (Chef, Manager, Store Keeper)
- **3 Meal Sessions** (Breakfast, Lunch, Dinner)
- **3 Vendors** (Food, Ingredients, Packaging suppliers)
- **7 Inventory Items** (Rice, Oil, Vegetables, Spices, Pulses)
- **Stock Movement History**
- **Reconciliation Records**

---

## 🧪 Quick Test Scenarios

### Test 1: View Inventory
1. Go to `/inventory/items`
2. See 7 items with stock levels
3. Click any item to edit

### Test 2: Record Stock Movement
1. Go to `/inventory/movements`
2. Click "Record Movement"
3. Select an item (e.g., "Basmati Rice")
4. Choose "Stock In"
5. Enter quantity: 100
6. Submit
7. Watch stock update automatically!

### Test 3: Stock Reconciliation
1. Go to `/inventory/reconciliations`
2. Click "New Reconciliation"
3. Select "Onions"
4. Current stock shows: 75 kg
5. Enter physical count: 70 kg
6. See discrepancy: -5 kg (-6.67%)
7. Enable "Auto-adjust stock level"
8. Submit
9. Stock updates automatically!

### Test 4: Manage Vendors
1. Go to `/procurement/vendors`
2. See 3 vendors with ratings
3. Click "Add Vendor"
4. Fill in the 4-tab form
5. Submit
6. Edit vendor to update ratings

---

## 🐛 Fixed Issues

### ✅ Dynamic Export Issue
**Problem:** `export const dynamic = 'force-dynamic'` causing errors

**Solution:** Removed from API routes (it's not needed for database-connected APIs)

**Documentation:** See `docs/NEXT_JS_DYNAMIC_EXPORT.md` for details

---

## 📊 Database Schema

### Collections Created
- users
- employees
- departments
- shifts
- mealsessions
- vendors
- inventoryitems
- stockmovements
- reconciliations

---

## 🔧 Troubleshooting

### MongoDB Not Running?
```bash
# Start MongoDB
# Windows: Start MongoDB service
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Port 3000 Already in Use?
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Need to Reset Data?
```bash
npm run seed
```
This will clear and repopulate all sample data.

---

## 📱 Mobile Responsive
All pages are fully responsive and work on:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

---

## 🎨 UI Features

- Dark mode support (toggle in nav bar)
- Real-time search and filters
- Loading states
- Error handling
- Success/error toasts
- Confirmation dialogs
- Form validation
- Stats cards
- Pagination ready

---

## 🚀 Next Steps

### Remaining Features to Build
1. Purchase Demands
2. Purchase Orders
3. Bills Management
4. Reports Module
5. Settings

### Estimated Time
- Purchase Demands: 2-3 hours
- Purchase Orders: 2-3 hours
- Bills: 2-3 hours
- Reports: 3-4 hours
- Settings: 1-2 hours

**Total: ~10-15 hours** to complete all remaining features

---

## 💡 Tips

1. **Test with Different Roles:** Create users with different roles to test permissions
2. **Try Bulk Operations:** Add multiple items, movements, vendors
3. **Test Edge Cases:** Try negative stock, large numbers, special characters
4. **Mobile Testing:** Open on your phone to see responsive design
5. **Dark Mode:** Toggle theme to see all components in dark mode

---

## 📞 Need Help?

1. Check `SETUP_GUIDE.md` for detailed setup
2. See `docs/MISSING_FEATURES_REPORT.md` for feature status
3. Review `docs/NEXT_JS_DYNAMIC_EXPORT.md` for technical details

---

**Happy Testing! 🎉**
