# Seed Script Schema Fixes

## Overview
Fixed schema mismatches in the seed script to align with actual Mongoose model schemas.

## Issues Fixed

### 1. Department Model
**Problem:** Seed script used nested objects for `createdBy` and `headOfDepartment`
```typescript
// ❌ Wrong
createdBy: {
  id: adminUser._id,
  name: adminUser.name,
  email: adminUser.email,
}
```

**Solution:** Use simple ObjectId references
```typescript
// ✅ Correct
createdBy: adminUser._id
headOfDepartment: adminUser._id
```

### 2. Shift Model
**Problem:** Seed script included `createdBy` field that doesn't exist in schema

**Solution:** Removed `createdBy` field entirely
```typescript
// ✅ Correct schema fields only
{
  name: 'Morning Shift',
  code: 'MORNING',
  startTime: '06:00',
  endTime: '14:00',
  status: 'ACTIVE',
}
```

### 3. MealSession Model
**Problem:** Seed script used non-existent fields: `mealType`, `isActive`, `maxCapacity`, `createdBy`

**Solution:** Use actual schema fields
```typescript
// ✅ Correct
{
  name: 'Breakfast',
  code: 'BKF',
  startTime: '07:00',
  endTime: '09:00',
  description: 'Morning breakfast service',
  status: 'ACTIVE',
  displayOrder: 1,
}
```

### 4. Employee Model
**Problem:**
- `createdBy` used nested object instead of ObjectId
- Missing required fields: `employmentType`, `hrmsData.systemType`, `hrmsData.externalId`

**Solution:** Fix `createdBy` and add required fields
```typescript
// ✅ Correct
{
  employeeId: 'EMP001',
  name: 'Rajesh Kumar',
  department: { id: departments[0]._id, name: departments[0].name }, // Nested object is correct here
  shift: { id: shifts[0]._id, name: shifts[0].name }, // Nested object is correct here
  employmentType: 'PERMANENT', // Added
  hrmsData: { // Added
    systemType: 'PERMANENT_HRMS',
    externalId: 'HRMS-EMP001',
  },
  biometricData: { // Fixed field name
    faceTemplateId: 'BIO001',
    faceDataSynced: false,
  },
  createdBy: adminUser._id, // Simple ObjectId
}
```

### 5. InventoryItem Model
**Problem:**
- `createdBy` used nested object
- `category` missing required `id` field
- Used non-existent `category.code` field
- Used non-existent `maxStockLevel` field

**Solution:** Fix category structure and createdBy
```typescript
// ✅ Correct
// Create category IDs first
const categoryGrains = new mongoose.Types.ObjectId()

{
  itemCode: 'RICE001',
  name: 'Basmati Rice',
  category: { id: categoryGrains, name: 'Grains' }, // Nested with id
  unit: 'KG',
  currentStock: 500,
  reorderLevel: 100,
  avgCostPerUnit: 85,
  status: 'ACTIVE',
  createdBy: adminUser._id, // Simple ObjectId
}
```

## Schema Patterns Identified

### Pattern A: Simple ObjectId References
Used by: Department, InventoryItem, Employee (for createdBy/updatedBy)
```typescript
createdBy: {
  type: Schema.Types.ObjectId,
  ref: 'User',
}
```

### Pattern B: Denormalized Nested Objects
Used by: Employee (department, shift), Vendor, StockMovement, Reconciliation
```typescript
department: {
  id: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
}
```

### Pattern C: No Tracking Fields
Used by: Shift, MealSession (no createdBy/updatedBy fields)

## Result
✅ Seed script now completes successfully
✅ Creates:
- 4 Departments
- 3 Shifts
- 3 Employees
- 3 Meal Sessions
- 3 Vendors
- 7 Inventory Items
- 3 Stock Movements
- 1 Reconciliation

## Command to Run
```bash
npm run seed
```

## Login Credentials
```
Email: admin@acims.com
Password: admin123
```
