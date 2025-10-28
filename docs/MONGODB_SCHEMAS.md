# ACIMS - MongoDB Schema Design
## Complete Database Schema with Mongoose Models

**Database:** MongoDB 6.x
**ODM:** Mongoose 8.x
**Design Philosophy:** Balanced approach with selective denormalization for performance

---

## Table of Contents

1. [Schema Design Principles](#schema-design-principles)
2. [Database Structure Overview](#database-structure-overview)
3. [Authentication & Users](#authentication--users)
4. [Employee Management](#employee-management)
5. [Meal Management](#meal-management)
6. [Inventory Management](#inventory-management)
7. [Procurement & Financial](#procurement--financial)
8. [Reporting & Notifications](#reporting--notifications)
9. [Integration & System](#integration--system)
10. [Indexes & Performance](#indexes--performance)

---

## Schema Design Principles

### Design Decisions

1. **Embedding vs. Referencing:**
   - **Embed:** One-to-few relationships, data that's always accessed together
   - **Reference:** One-to-many, many-to-many, frequently updated data

2. **Denormalization:**
   - Store employee name in transactions for faster queries (avoid joins)
   - Store department name alongside department reference
   - Accept some data duplication for read performance

3. **Soft Deletes:**
   - All entities use `isDeleted` flag instead of hard deletes
   - Maintains referential integrity and audit trail

4. **Timestamps:**
   - All schemas include `createdAt` and `updatedAt`
   - Use Mongoose timestamps option

5. **Audit Trail:**
   - Track `createdBy` and `updatedBy` on critical entities
   - Use middleware for automatic population

---

## Database Structure Overview

```
Collections:
├── Authentication & Users
│   ├── users
│   └── sessions
├── Employee Management
│   ├── employees
│   ├── departments
│   ├── shifts
│   └── biometric_templates
├── Meal Management
│   ├── meal_sessions
│   ├── meal_commitments
│   ├── meal_transactions
│   ├── guest_meals
│   └── meal_eligibility_rules
├── Inventory Management
│   ├── inventory_items
│   ├── inventory_categories
│   ├── stock_receipts
│   ├── stock_issuance
│   ├── stock_reconciliation
│   └── stock_movements (auto-generated)
├── Procurement & Financial
│   ├── vendors
│   ├── demand_lists
│   ├── purchase_orders
│   ├── bills
│   ├── payments
│   └── vendor_ledger (computed view)
├── Reporting & Notifications
│   ├── notifications
│   ├── notification_templates
│   ├── report_schedules
│   └── audit_logs
└── Integration & System
    ├── integration_logs
    ├── sync_status
    ├── devices
    └── system_settings
```

---

## Authentication & Users

### 1. Users Collection

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'HR_ADMIN' | 'CANTEEN_MANAGER' |
        'STORE_KEEPER' | 'DEPARTMENT_HEAD' | 'PURCHASE_COMMITTEE';
  employeeId?: Types.ObjectId; // Reference to Employee if user is an employee
  department?: Types.ObjectId; // Reference to Department
  permissions: string[]; // Array of permission strings
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
      email: boolean;
      inApp: boolean;
      sms: boolean;
    };
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: [
        'SUPER_ADMIN',
        'ADMIN',
        'HR_ADMIN',
        'CANTEEN_MANAGER',
        'STORE_KEEPER',
        'DEPARTMENT_HEAD',
        'PURCHASE_COMMITTEE',
      ],
      required: [true, 'Role is required'],
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    lastLogin: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light',
      },
      language: {
        type: String,
        default: 'en',
      },
      notifications: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ employeeId: 1 });

// Methods
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (
  JWTTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);
```

### 2. Sessions Collection (for JWT management)

```typescript
export interface ISession extends Document {
  userId: Types.ObjectId;
  token: string;
  refreshToken: string;
  device: {
    userAgent: string;
    ip: string;
    platform?: string;
    browser?: string;
  };
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    device: {
      userAgent: String,
      ip: String,
      platform: String,
      browser: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ token: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
```

---

## Employee Management

### 3. Departments Collection

```typescript
export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: Types.ObjectId; // Reference to User
  parentDepartment?: Types.ObjectId; // For hierarchical structure
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: String,
    headOfDepartment: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    parentDepartment: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ name: 1 });
departmentSchema.index({ status: 1 });

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
```

### 4. Shifts Collection

```typescript
export interface IShift extends Document {
  name: string;
  code: string;
  startTime: string; // "08:00"
  endTime: string; // "17:00"
  eligibleMealSessions: Types.ObjectId[]; // References to MealSession
  overtimeThreshold?: number; // Hours
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
  {
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Shift code is required'],
      unique: true,
      uppercase: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'],
    },
    eligibleMealSessions: [{
      type: Schema.Types.ObjectId,
      ref: 'MealSession',
    }],
    overtimeThreshold: Number,
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

shiftSchema.index({ code: 1 }, { unique: true });
shiftSchema.index({ status: 1 });

export const Shift = mongoose.model<IShift>('Shift', shiftSchema);
```

### 5. Employees Collection

```typescript
export interface IEmployee extends Document {
  employeeId: string; // Company employee ID
  name: string;
  email?: string;
  phone?: string;
  department: {
    id: Types.ObjectId;
    name: string; // Denormalized for faster queries
  };
  shift: {
    id: Types.ObjectId;
    name: string; // Denormalized
  };
  employmentType: 'PERMANENT' | 'VENDOR' | 'CONTRACT' | 'TEMPORARY';
  designation?: string;
  joiningDate: Date;
  exitDate?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  mealEligibility: {
    enabled: boolean;
    restrictedMeals?: Types.ObjectId[]; // Specific meals they can't access
    specialMeals?: Types.ObjectId[]; // Special meals they can access (OT, etc.)
  };
  biometricData: {
    faceTemplateId?: string; // ID in biometric system
    faceDataSynced: boolean;
    lastSyncedAt?: Date;
  };
  hrmsData: {
    systemType: 'PERMANENT_HRMS' | 'VENDOR_HRMS'; // Which HRMS they belong to
    externalId: string; // Their ID in the external HRMS
    lastSyncedAt?: Date;
  };
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // Allow multiple null values
    },
    phone: {
      type: String,
      trim: true,
    },
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
    },
    shift: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Shift',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    employmentType: {
      type: String,
      enum: ['PERMANENT', 'VENDOR', 'CONTRACT', 'TEMPORARY'],
      required: true,
    },
    designation: String,
    joiningDate: {
      type: Date,
      required: true,
    },
    exitDate: Date,
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    mealEligibility: {
      enabled: {
        type: Boolean,
        default: true,
      },
      restrictedMeals: [{
        type: Schema.Types.ObjectId,
        ref: 'MealSession',
      }],
      specialMeals: [{
        type: Schema.Types.ObjectId,
        ref: 'MealSession',
      }],
    },
    biometricData: {
      faceTemplateId: String,
      faceDataSynced: {
        type: Boolean,
        default: false,
      },
      lastSyncedAt: Date,
    },
    hrmsData: {
      systemType: {
        type: String,
        enum: ['PERMANENT_HRMS', 'VENDOR_HRMS'],
        required: true,
      },
      externalId: {
        type: String,
        required: true,
      },
      lastSyncedAt: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
employeeSchema.index({ employeeId: 1 }, { unique: true });
employeeSchema.index({ 'department.id': 1, status: 1 });
employeeSchema.index({ 'shift.id': 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ employmentType: 1 });
employeeSchema.index({ 'hrmsData.externalId': 1 });
employeeSchema.index({ name: 'text', employeeId: 'text' }); // Text search

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
```

### 6. Biometric Templates Collection

```typescript
export interface IBiometricTemplate extends Document {
  employeeId: Types.ObjectId;
  employee: {
    id: string; // Employee ID string
    name: string;
  };
  templateData: string; // Base64 encoded or encrypted template
  photoUrl?: string; // URL to employee photo
  deviceIds: string[]; // Devices where this template is synced
  syncStatus: {
    lastSyncedAt?: Date;
    failedDevices?: string[];
    syncErrors?: {
      deviceId: string;
      error: string;
      timestamp: Date;
    }[];
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const biometricTemplateSchema = new Schema<IBiometricTemplate>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
    },
    employee: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    templateData: {
      type: String,
      required: true,
      select: false, // Don't return by default for security
    },
    photoUrl: String,
    deviceIds: [String],
    syncStatus: {
      lastSyncedAt: Date,
      failedDevices: [String],
      syncErrors: [{
        deviceId: String,
        error: String,
        timestamp: Date,
      }],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

biometricTemplateSchema.index({ employeeId: 1 }, { unique: true });

export const BiometricTemplate = mongoose.model<IBiometricTemplate>(
  'BiometricTemplate',
  biometricTemplateSchema
);
```

### 7. Employee Attendance (Cached from HRMS)

```typescript
export interface IEmployeeAttendance extends Document {
  employeeId: Types.ObjectId;
  employee: {
    id: string;
    name: string;
  };
  date: Date; // Date only (YYYY-MM-DD)
  shift: {
    id: Types.ObjectId;
    name: string;
  };
  status: 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'HALF_DAY' | 'LATE';
  checkIn?: Date;
  checkOut?: Date;
  overtimeHours?: number;
  isOTApproved: boolean;
  syncedFrom: 'PERMANENT_HRMS' | 'VENDOR_HRMS';
  lastSyncedAt: Date;
}

const employeeAttendanceSchema = new Schema<IEmployeeAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    employee: {
      id: String,
      name: String,
    },
    date: {
      type: Date,
      required: true,
    },
    shift: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Shift',
      },
      name: String,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'ON_LEAVE', 'HALF_DAY', 'LATE'],
      required: true,
    },
    checkIn: Date,
    checkOut: Date,
    overtimeHours: {
      type: Number,
      default: 0,
    },
    isOTApproved: {
      type: Boolean,
      default: false,
    },
    syncedFrom: {
      type: String,
      enum: ['PERMANENT_HRMS', 'VENDOR_HRMS'],
      required: true,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We manage dates manually
  }
);

// Compound index for unique constraint and fast lookups
employeeAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
employeeAttendanceSchema.index({ date: -1 });
employeeAttendanceSchema.index({ status: 1, date: -1 });

// TTL index - keep only 90 days of attendance data
employeeAttendanceSchema.index({ date: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export const EmployeeAttendance = mongoose.model<IEmployeeAttendance>(
  'EmployeeAttendance',
  employeeAttendanceSchema
);
```

---

## Meal Management

### 8. Meal Sessions Collection

```typescript
export interface IMealSession extends Document {
  name: string;
  code: string; // "BREAKFAST", "LUNCH", etc.
  description?: string;
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  isOvertimeMeal: boolean; // If this requires OT approval
  eligibleShifts: Types.ObjectId[]; // References to Shift
  displayOrder: number; // For UI ordering
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mealSessionSchema = new Schema<IMealSession>(
  {
    name: {
      type: String,
      required: [true, 'Meal session name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Meal session code is required'],
      unique: true,
      uppercase: true,
    },
    description: String,
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
    },
    isOvertimeMeal: {
      type: Boolean,
      default: false,
    },
    eligibleShifts: [{
      type: Schema.Types.ObjectId,
      ref: 'Shift',
    }],
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

mealSessionSchema.index({ code: 1 }, { unique: true });
mealSessionSchema.index({ status: 1, displayOrder: 1 });

export const MealSession = mongoose.model<IMealSession>('MealSession', mealSessionSchema);
```

### 9. Meal Commitments Collection

```typescript
export interface IMealCommitment extends Document {
  date: Date; // Date for which commitment is made
  mealSession: {
    id: Types.ObjectId;
    name: string;
    code: string;
  };
  department: {
    id: Types.ObjectId;
    name: string;
  };
  committedCount: number;
  actualCount?: number; // Filled after meal completion
  variance?: number; // Calculated: actualCount - committedCount
  submittedBy: {
    id: Types.ObjectId;
    name: string;
  };
  submittedAt: Date;
  status: 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'COMPLETED';
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mealCommitmentSchema = new Schema<IMealCommitment>(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    mealSession: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'MealSession',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
    },
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
    },
    committedCount: {
      type: Number,
      required: [true, 'Committed count is required'],
      min: [0, 'Count cannot be negative'],
    },
    actualCount: {
      type: Number,
      min: 0,
    },
    variance: Number,
    submittedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'COMPLETED'],
      default: 'DRAFT',
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique constraint
mealCommitmentSchema.index(
  { date: 1, 'mealSession.id': 1, 'department.id': 1 },
  { unique: true }
);
mealCommitmentSchema.index({ date: -1, status: 1 });
mealCommitmentSchema.index({ 'department.id': 1, date: -1 });

// Middleware to calculate variance
mealCommitmentSchema.pre('save', function (next) {
  if (this.actualCount !== undefined) {
    this.variance = this.actualCount - this.committedCount;
  }
  next();
});

export const MealCommitment = mongoose.model<IMealCommitment>(
  'MealCommitment',
  mealCommitmentSchema
);
```

### 10. Meal Transactions Collection (Critical - High Volume)

```typescript
export interface IMealTransaction extends Document {
  transactionId: string; // Unique transaction ID
  date: Date;
  mealSession: {
    id: Types.ObjectId;
    name: string;
    code: string;
  };
  employee: {
    id: Types.ObjectId;
    employeeId: string; // Company employee ID
    name: string;
  };
  department: {
    id: Types.ObjectId;
    name: string;
  };
  shift: {
    id: Types.ObjectId;
    name: string;
  };
  device: {
    id: string; // Device ID
    name: string;
    location?: string;
  };
  verificationMethod: 'FACE_RECOGNITION' | 'MANUAL' | 'GUEST';
  verificationStatus: 'AUTHORIZED' | 'UNAUTHORIZED' | 'OVERRIDE';
  verificationConfidence?: number; // For face recognition (0-100)
  eligibilityCheck: {
    wasEligible: boolean;
    attendanceStatus: 'PRESENT' | 'ABSENT' | 'NOT_CHECKED';
    shiftMatch: boolean;
    overtimeApproved?: boolean;
    failureReason?: string;
  };
  isGuestMeal: boolean;
  guestMealReference?: Types.ObjectId; // Reference to GuestMeal if applicable
  authorizedBy?: {
    id: Types.ObjectId;
    name: string;
  }; // If manual override
  timestamp: Date; // Exact time of transaction
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
}

const mealTransactionSchema = new Schema<IMealTransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    mealSession: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'MealSession',
        required: true,
      },
      name: String,
      code: String,
    },
    employee: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
      },
      employeeId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    department: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
      name: String,
    },
    shift: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Shift',
      },
      name: String,
    },
    device: {
      id: {
        type: String,
        required: true,
      },
      name: String,
      location: String,
    },
    verificationMethod: {
      type: String,
      enum: ['FACE_RECOGNITION', 'MANUAL', 'GUEST'],
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['AUTHORIZED', 'UNAUTHORIZED', 'OVERRIDE'],
      required: true,
    },
    verificationConfidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    eligibilityCheck: {
      wasEligible: {
        type: Boolean,
        required: true,
      },
      attendanceStatus: {
        type: String,
        enum: ['PRESENT', 'ABSENT', 'NOT_CHECKED'],
      },
      shiftMatch: Boolean,
      overtimeApproved: Boolean,
      failureReason: String,
    },
    isGuestMeal: {
      type: Boolean,
      default: false,
    },
    guestMealReference: {
      type: Schema.Types.ObjectId,
      ref: 'GuestMeal',
    },
    authorizedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt
  }
);

// Critical indexes for performance
mealTransactionSchema.index({ transactionId: 1 }, { unique: true });
mealTransactionSchema.index({ date: -1, 'mealSession.id': 1 });
mealTransactionSchema.index({ 'employee.id': 1, date: -1 });
mealTransactionSchema.index({ 'department.id': 1, date: -1 });
mealTransactionSchema.index({ timestamp: -1 });
mealTransactionSchema.index({ verificationStatus: 1, date: -1 });

// TTL index - keep 5 years of data, then archive
mealTransactionSchema.index({ date: 1 }, { expireAfterSeconds: 157680000 }); // 5 years

export const MealTransaction = mongoose.model<IMealTransaction>(
  'MealTransaction',
  mealTransactionSchema
);
```

### 11. Guest Meals Collection

```typescript
export interface IGuestMeal extends Document {
  guestName: string;
  guestCompany?: string;
  guestContact?: string;
  hostEmployee: {
    id: Types.ObjectId;
    employeeId: string;
    name: string;
  };
  department: {
    id: Types.ObjectId;
    name: string;
  };
  mealSession: {
    id: Types.ObjectId;
    name: string;
  };
  mealDate: Date;
  numberOfGuests: number;
  purpose: string;
  requestedBy: {
    id: Types.ObjectId;
    name: string;
    role: string;
  };
  requestedAt: Date;
  approvalWorkflow: {
    approver: {
      id: Types.ObjectId;
      name: string;
    };
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedAt?: Date;
    rejectionReason?: string;
    comments?: string;
  }[];
  finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONSUMED';
  transactionReferences?: Types.ObjectId[]; // References to MealTransaction
  cost?: number; // For internal billing
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const guestMealSchema = new Schema<IGuestMeal>(
  {
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
    },
    guestCompany: String,
    guestContact: String,
    hostEmployee: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
      },
      employeeId: String,
      name: String,
    },
    department: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
      },
      name: String,
    },
    mealSession: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'MealSession',
        required: true,
      },
      name: String,
    },
    mealDate: {
      type: Date,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    purpose: {
      type: String,
      required: true,
    },
    requestedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
      role: String,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvalWorkflow: [{
      approver: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        name: String,
      },
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
      },
      approvedAt: Date,
      rejectionReason: String,
      comments: String,
    }],
    finalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CONSUMED'],
      default: 'PENDING',
    },
    transactionReferences: [{
      type: Schema.Types.ObjectId,
      ref: 'MealTransaction',
    }],
    cost: Number,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

guestMealSchema.index({ mealDate: -1, finalStatus: 1 });
guestMealSchema.index({ 'department.id': 1, mealDate: -1 });
guestMealSchema.index({ 'requestedBy.id': 1 });

export const GuestMeal = mongoose.model<IGuestMeal>('GuestMeal', guestMealSchema);
```

---

## Inventory Management

### 12. Inventory Categories Collection

```typescript
export interface IInventoryCategory extends Document {
  name: string;
  code: string;
  description?: string;
  parentCategory?: Types.ObjectId; // For hierarchical categories
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryCategorySchema = new Schema<IInventoryCategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      uppercase: true,
    },
    description: String,
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryCategory',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

inventoryCategorySchema.index({ code: 1 }, { unique: true });

export const InventoryCategory = mongoose.model<IInventoryCategory>(
  'InventoryCategory',
  inventoryCategorySchema
);
```

### 13. Inventory Items Collection

```typescript
export interface IInventoryItem extends Document {
  itemCode: string;
  name: string;
  description?: string;
  category: {
    id: Types.ObjectId;
    name: string;
  };
  unit: string; // "kg", "ltr", "pcs", etc.
  alternateUnits?: {
    unit: string;
    conversionFactor: number; // How many base units = 1 alternate unit
  }[];
  currentStock: number; // Real-time balance
  reorderLevel: number;
  reorderQuantity?: number;
  avgCostPerUnit: number; // Weighted average cost
  totalValue: number; // currentStock * avgCostPerUnit
  vendors: Types.ObjectId[]; // Preferred vendors
  storageLocation?: string;
  shelfLife?: number; // Days
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: String,
    category: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryCategory',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      uppercase: true,
    },
    alternateUnits: [{
      unit: String,
      conversionFactor: Number,
    }],
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reorderQuantity: {
      type: Number,
      min: 0,
    },
    avgCostPerUnit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    vendors: [{
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    }],
    storageLocation: String,
    shelfLife: Number, // Days
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
inventoryItemSchema.index({ itemCode: 1 }, { unique: true });
inventoryItemSchema.index({ 'category.id': 1, status: 1 });
inventoryItemSchema.index({ status: 1, currentStock: 1 }); // For low stock queries
inventoryItemSchema.index({ name: 'text', itemCode: 'text' }); // Text search

// Middleware to update total value
inventoryItemSchema.pre('save', function (next) {
  this.totalValue = this.currentStock * this.avgCostPerUnit;
  next();
});

// Virtual for low stock status
inventoryItemSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.reorderLevel;
});

export const InventoryItem = mongoose.model<IInventoryItem>(
  'InventoryItem',
  inventoryItemSchema
);
```

### 14. Stock Receipts Collection

```typescript
export interface IStockReceipt extends Document {
  receiptNumber: string;
  receiptDate: Date;
  purchaseOrderReference?: Types.ObjectId; // Reference to PO
  vendor: {
    id: Types.ObjectId;
    name: string;
  };
  items: {
    item: {
      id: Types.ObjectId;
      itemCode: string;
      name: string;
    };
    quantity: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
    expiryDate?: Date;
    batchNumber?: string;
  }[];
  totalAmount: number;
  invoiceNumber?: string;
  invoiceDate?: Date;
  invoiceDocument?: string; // URL to uploaded invoice
  receivedBy: {
    id: Types.ObjectId;
    name: string;
  };
  verifiedBy?: {
    id: Types.ObjectId;
    name: string;
    verifiedAt?: Date;
  };
  status: 'DRAFT' | 'RECEIVED' | 'VERIFIED' | 'POSTED';
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stockReceiptSchema = new Schema<IStockReceipt>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    receiptDate: {
      type: Date,
      required: true,
    },
    purchaseOrderReference: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    vendor: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    items: [{
      item: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'InventoryItem',
          required: true,
        },
        itemCode: String,
        name: String,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        required: true,
      },
      costPerUnit: {
        type: Number,
        required: true,
        min: 0,
      },
      totalCost: {
        type: Number,
        required: true,
        min: 0,
      },
      expiryDate: Date,
      batchNumber: String,
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    invoiceNumber: String,
    invoiceDate: Date,
    invoiceDocument: String, // S3 URL
    receivedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
    },
    verifiedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      verifiedAt: Date,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'RECEIVED', 'VERIFIED', 'POSTED'],
      default: 'DRAFT',
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

stockReceiptSchema.index({ receiptNumber: 1 }, { unique: true });
stockReceiptSchema.index({ receiptDate: -1 });
stockReceiptSchema.index({ 'vendor.id': 1, receiptDate: -1 });
stockReceiptSchema.index({ status: 1 });

// Middleware to calculate totalAmount
stockReceiptSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalCost, 0);
  next();
});

export const StockReceipt = mongoose.model<IStockReceipt>(
  'StockReceipt',
  stockReceiptSchema
);
```

### 15. Stock Issuance Collection

```typescript
export interface IStockIssuance extends Document {
  issuanceNumber: string;
  issuanceDate: Date;
  purpose: 'MEAL_COOKING' | 'WASTAGE' | 'TRANSFER' | 'OTHER';
  mealReference?: {
    date: Date;
    mealSession: {
      id: Types.ObjectId;
      name: string;
    };
  };
  items: {
    item: {
      id: Types.ObjectId;
      itemCode: string;
      name: string;
    };
    quantity: number;
    unit: string;
    costPerUnit: number; // From current avg cost
    totalCost: number;
  }[];
  totalAmount: number;
  issuedBy: {
    id: Types.ObjectId;
    name: string;
  };
  approvedBy?: {
    id: Types.ObjectId;
    name: string;
  };
  status: 'DRAFT' | 'ISSUED' | 'POSTED';
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stockIssuanceSchema = new Schema<IStockIssuance>(
  {
    issuanceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    issuanceDate: {
      type: Date,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['MEAL_COOKING', 'WASTAGE', 'TRANSFER', 'OTHER'],
      required: true,
    },
    mealReference: {
      date: Date,
      mealSession: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'MealSession',
        },
        name: String,
      },
    },
    items: [{
      item: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'InventoryItem',
          required: true,
        },
        itemCode: String,
        name: String,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: String,
      costPerUnit: {
        type: Number,
        required: true,
      },
      totalCost: {
        type: Number,
        required: true,
      },
    }],
    totalAmount: {
      type: Number,
      required: true,
    },
    issuedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
    },
    approvedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'POSTED'],
      default: 'DRAFT',
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

stockIssuanceSchema.index({ issuanceNumber: 1 }, { unique: true });
stockIssuanceSchema.index({ issuanceDate: -1 });
stockIssuanceSchema.index({ purpose: 1, issuanceDate: -1 });
stockIssuanceSchema.index({ status: 1 });

stockIssuanceSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalCost, 0);
  next();
});

export const StockIssuance = mongoose.model<IStockIssuance>(
  'StockIssuance',
  stockIssuanceSchema
);
```

### 16. Stock Reconciliation Collection

```typescript
export interface IStockReconciliation extends Document {
  reconciliationNumber: string;
  reconciliationDate: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  items: {
    item: {
      id: Types.ObjectId;
      itemCode: string;
      name: string;
    };
    openingStock: number;
    receipts: number;
    issuance: number;
    expectedClosing: number; // Opening + Receipts - Issuance
    actualClosing: number; // Physical count
    variance: number; // Actual - Expected
    varianceValue: number; // Variance * current cost
    remarks?: string;
  }[];
  totalVarianceValue: number;
  performedBy: {
    id: Types.ObjectId;
    name: string;
  };
  verifiedBy?: {
    id: Types.ObjectId;
    name: string;
    verifiedAt?: Date;
  };
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED';
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stockReconciliationSchema = new Schema<IStockReconciliation>(
  {
    reconciliationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    reconciliationDate: {
      type: Date,
      required: true,
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    items: [{
      item: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'InventoryItem',
          required: true,
        },
        itemCode: String,
        name: String,
      },
      openingStock: Number,
      receipts: Number,
      issuance: Number,
      expectedClosing: Number,
      actualClosing: {
        type: Number,
        required: true,
      },
      variance: Number,
      varianceValue: Number,
      remarks: String,
    }],
    totalVarianceValue: Number,
    performedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
    },
    verifiedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      verifiedAt: Date,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED'],
      default: 'DRAFT',
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

stockReconciliationSchema.index({ reconciliationNumber: 1 }, { unique: true });
stockReconciliationSchema.index({ reconciliationDate: -1 });

// Middleware to calculate variances
stockReconciliationSchema.pre('save', function (next) {
  this.items.forEach(item => {
    item.variance = item.actualClosing - item.expectedClosing;
  });
  this.totalVarianceValue = this.items.reduce(
    (sum, item) => sum + (item.varianceValue || 0),
    0
  );
  next();
});

export const StockReconciliation = mongoose.model<IStockReconciliation>(
  'StockReconciliation',
  stockReconciliationSchema
);
```

### 17. Stock Movements (Auto-generated Log)

```typescript
export interface IStockMovement extends Document {
  item: {
    id: Types.ObjectId;
    itemCode: string;
    name: string;
  };
  movementType: 'RECEIPT' | 'ISSUANCE' | 'ADJUSTMENT' | 'OPENING' | 'CLOSING';
  transactionType: 'IN' | 'OUT';
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalValue: number;
  balanceAfter: number; // Stock balance after this movement
  referenceDocument: {
    type: 'RECEIPT' | 'ISSUANCE' | 'RECONCILIATION' | 'ADJUSTMENT';
    id: Types.ObjectId;
    number: string;
  };
  date: Date;
  createdBy: {
    id: Types.ObjectId;
    name: string;
  };
  notes?: string;
  createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    item: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
      },
      itemCode: String,
      name: String,
    },
    movementType: {
      type: String,
      enum: ['RECEIPT', 'ISSUANCE', 'ADJUSTMENT', 'OPENING', 'CLOSING'],
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['IN', 'OUT'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: String,
    costPerUnit: Number,
    totalValue: Number,
    balanceAfter: {
      type: Number,
      required: true,
    },
    referenceDocument: {
      type: {
        type: String,
        enum: ['RECEIPT', 'ISSUANCE', 'RECONCILIATION', 'ADJUSTMENT'],
      },
      id: Schema.Types.ObjectId,
      number: String,
    },
    date: {
      type: Date,
      required: true,
    },
    createdBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
    },
    notes: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for fast queries
stockMovementSchema.index({ 'item.id': 1, date: -1 });
stockMovementSchema.index({ date: -1 });
stockMovementSchema.index({ movementType: 1, date: -1 });

export const StockMovement = mongoose.model<IStockMovement>(
  'StockMovement',
  stockMovementSchema
);
```

---

## Procurement & Financial

### 18. Vendors Collection

```typescript
export interface IVendor extends Document {
  vendorCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  itemsSupplied: Types.ObjectId[]; // References to InventoryItem
  paymentTerms?: string; // "NET 30", "COD", etc.
  taxId?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode?: string;
    swiftCode?: string;
  };
  rating?: number; // 1-5
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  notes?: string;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    vendorCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    contactPerson: String,
    email: {
      type: String,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    itemsSupplied: [{
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
    }],
    paymentTerms: String,
    taxId: String,
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      swiftCode: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'BLACKLISTED'],
      default: 'ACTIVE',
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ vendorCode: 1 }, { unique: true });
vendorSchema.index({ status: 1 });
vendorSchema.index({ name: 'text' });

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);
```

### 19. Demand Lists Collection

```typescript
export interface IDemandList extends Document {
  demandNumber: string;
  demandDate: Date;
  requiredByDate: Date;
  generationType: 'AUTO' | 'MANUAL';
  basedOnCommitments?: {
    startDate: Date;
    endDate: Date;
    mealSessions: Types.ObjectId[];
  };
  items: {
    item: {
      id: Types.ObjectId;
      itemCode: string;
      name: string;
    };
    currentStock: number;
    requiredQuantity: number;
    demandedQuantity: number;
    unit: string;
    suggestedVendors?: Types.ObjectId[];
    remarks?: string;
  }[];
  createdBy: {
    id: Types.ObjectId;
    name: string;
  };
  approvalWorkflow: {
    approver: {
      id: Types.ObjectId;
      name: string;
      role: string;
    };
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedAt?: Date;
    comments?: string;
  }[];
  finalStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PO_CREATED';
  purchaseOrderReference?: Types.ObjectId;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const demandListSchema = new Schema<IDemandList>(
  {
    demandNumber: {
      type: String,
      required: true,
      unique: true,
    },
    demandDate: {
      type: Date,
      required: true,
    },
    requiredByDate: {
      type: Date,
      required: true,
    },
    generationType: {
      type: String,
      enum: ['AUTO', 'MANUAL'],
      required: true,
    },
    basedOnCommitments: {
      startDate: Date,
      endDate: Date,
      mealSessions: [{
        type: Schema.Types.ObjectId,
        ref: 'MealSession',
      }],
    },
    items: [{
      item: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'InventoryItem',
          required: true,
        },
        itemCode: String,
        name: String,
      },
      currentStock: Number,
      requiredQuantity: Number,
      demandedQuantity: {
        type: Number,
        required: true,
      },
      unit: String,
      suggestedVendors: [{
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
      }],
      remarks: String,
    }],
    createdBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
    },
    approvalWorkflow: [{
      approver: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        name: String,
        role: String,
      },
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
      },
      approvedAt: Date,
      comments: String,
    }],
    finalStatus: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PO_CREATED'],
      default: 'DRAFT',
    },
    purchaseOrderReference: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

demandListSchema.index({ demandNumber: 1 }, { unique: true });
demandListSchema.index({ demandDate: -1, finalStatus: 1 });
demandListSchema.index({ finalStatus: 1 });

export const DemandList = mongoose.model<IDemandList>('DemandList', demandListSchema);
```

### 20. Purchase Orders Collection

```typescript
export interface IPurchaseOrder extends Document {
  poNumber: string;
  poDate: Date;
  demandListReference?: Types.ObjectId;
  vendor: {
    id: Types.ObjectId;
    vendorCode: string;
    name: string;
    contact: string;
  };
  deliveryDate: Date;
  deliveryAddress?: string;
  items: {
    item: {
      id: Types.ObjectId;
      itemCode: string;
      name: string;
    };
    quantity: number;
    unit: string;
    ratePerUnit: number;
    taxPercent: number;
    taxAmount: number;
    totalAmount: number;
    receivedQuantity?: number;
    pendingQuantity?: number;
  }[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  paymentTerms?: string;
  createdBy: {
    id: Types.ObjectId;
    name: string;
  };
  approvedBy?: {
    id: Types.ObjectId;
    name: string;
    approvedAt: Date;
  };
  status: 'DRAFT' | 'APPROVED' | 'SENT_TO_VENDOR' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED';
  fulfilmentStatus: {
    receiptsGenerated: number;
    totalReceived: number;
    pendingAmount: number;
  };
  notes?: string;
  attachments?: string[]; // URLs
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
    },
    poDate: {
      type: Date,
      required: true,
    },
    demandListReference: {
      type: Schema.Types.ObjectId,
      ref: 'DemandList',
    },
    vendor: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
      },
      vendorCode: String,
      name: String,
      contact: String,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    deliveryAddress: String,
    items: [{
      item: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'InventoryItem',
          required: true,
        },
        itemCode: String,
        name: String,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: String,
      ratePerUnit: {
        type: Number,
        required: true,
        min: 0,
      },
      taxPercent: {
        type: Number,
        default: 0,
      },
      taxAmount: Number,
      totalAmount: Number,
      receivedQuantity: {
        type: Number,
        default: 0,
      },
      pendingQuantity: Number,
    }],
    subtotal: Number,
    totalTax: Number,
    totalAmount: Number,
    paymentTerms: String,
    createdBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
    },
    approvedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      approvedAt: Date,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'APPROVED',
        'SENT_TO_VENDOR',
        'PARTIALLY_RECEIVED',
        'FULLY_RECEIVED',
        'CANCELLED',
      ],
      default: 'DRAFT',
    },
    fulfilmentStatus: {
      receiptsGenerated: {
        type: Number,
        default: 0,
      },
      totalReceived: {
        type: Number,
        default: 0,
      },
      pendingAmount: Number,
    },
    notes: String,
    attachments: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

purchaseOrderSchema.index({ poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ poDate: -1, status: 1 });
purchaseOrderSchema.index({ 'vendor.id': 1, poDate: -1 });
purchaseOrderSchema.index({ status: 1 });

// Middleware to calculate amounts
purchaseOrderSchema.pre('save', function (next) {
  this.items.forEach(item => {
    const itemTotal = item.quantity * item.ratePerUnit;
    item.taxAmount = (itemTotal * item.taxPercent) / 100;
    item.totalAmount = itemTotal + item.taxAmount;
    item.pendingQuantity = item.quantity - (item.receivedQuantity || 0);
  });

  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.ratePerUnit);
  }, 0);

  this.totalTax = this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  this.totalAmount = this.subtotal + this.totalTax;

  next();
});

export const PurchaseOrder = mongoose.model<IPurchaseOrder>(
  'PurchaseOrder',
  purchaseOrderSchema
);
```

### 21. Bills Collection

```typescript
export interface IBill extends Document {
  billNumber: string;
  billDate: Date;
  dueDate: Date;
  vendor: {
    id: Types.ObjectId;
    vendorCode: string;
    name: string;
  };
  purchaseOrderReference?: Types.ObjectId;
  receiptReferences?: Types.ObjectId[];
  items: {
    description: string;
    item?: {
      id: Types.ObjectId;
      itemCode: string;
      name: string;
    };
    quantity?: number;
    unit?: string;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  billDocument?: string; // URL to uploaded bill
  enteredBy: {
    id: Types.ObjectId;
    name: string;
  };
  verifiedBy?: {
    id: Types.ObjectId;
    name: string;
    verifiedAt: Date;
  };
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED';
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const billSchema = new Schema<IBill>(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    billDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    vendor: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
      },
      vendorCode: String,
      name: String,
    },
    purchaseOrderReference: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    receiptReferences: [{
      type: Schema.Types.ObjectId,
      ref: 'StockReceipt',
    }],
    items: [{
      description: {
        type: String,
        required: true,
      },
      item: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'InventoryItem',
        },
        itemCode: String,
        name: String,
      },
      quantity: Number,
      unit: String,
      rate: {
        type: Number,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    }],
    subtotal: Number,
    tax: Number,
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: Number,
    billDocument: String,
    enteredBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
    },
    verifiedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      verifiedAt: Date,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID'],
      default: 'UNPAID',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED'],
      default: 'DRAFT',
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

billSchema.index({ billNumber: 1 }, { unique: true });
billSchema.index({ billDate: -1, paymentStatus: 1 });
billSchema.index({ 'vendor.id': 1, billDate: -1 });
billSchema.index({ dueDate: 1, paymentStatus: 1 }); // For payment reminders

// Middleware
billSchema.pre('save', function (next) {
  this.balanceAmount = this.totalAmount - this.paidAmount;

  if (this.paidAmount === 0) {
    this.paymentStatus = 'UNPAID';
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'FULLY_PAID';
  } else {
    this.paymentStatus = 'PARTIALLY_PAID';
  }

  next();
});

export const Bill = mongoose.model<IBill>('Bill', billSchema);
```

### 22. Payments Collection

```typescript
export interface IPayment extends Document {
  paymentNumber: string;
  paymentDate: Date;
  vendor: {
    id: Types.ObjectId;
    vendorCode: string;
    name: string;
  };
  billReferences: {
    billId: Types.ObjectId;
    billNumber: string;
    billAmount: number;
    paidAmount: number;
  }[];
  totalAmount: number;
  paymentMethod: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'OTHER';
  paymentDetails?: {
    chequeNumber?: string;
    chequeDate?: Date;
    bankName?: string;
    transactionReference?: string;
  };
  paidBy: {
    id: Types.ObjectId;
    name: string;
  };
  approvedBy?: {
    id: Types.ObjectId;
    name: string;
    approvedAt: Date;
  };
  status: 'DRAFT' | 'APPROVED' | 'POSTED';
  notes?: string;
  attachments?: string[]; // URLs
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    vendor: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
      },
      vendorCode: String,
      name: String,
    },
    billReferences: [{
      billId: {
        type: Schema.Types.ObjectId,
        ref: 'Bill',
        required: true,
      },
      billNumber: String,
      billAmount: Number,
      paidAmount: {
        type: Number,
        required: true,
      },
    }],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'OTHER'],
      required: true,
    },
    paymentDetails: {
      chequeNumber: String,
      chequeDate: Date,
      bankName: String,
      transactionReference: String,
    },
    paidBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
    },
    approvedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      approvedAt: Date,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'POSTED'],
      default: 'DRAFT',
    },
    notes: String,
    attachments: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ paymentNumber: 1 }, { unique: true });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ 'vendor.id': 1, paymentDate: -1 });
paymentSchema.index({ status: 1 });

// Middleware
paymentSchema.pre('save', function (next) {
  this.totalAmount = this.billReferences.reduce(
    (sum, ref) => sum + ref.paidAmount,
    0
  );
  next();
});

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
```

---

## Reporting & Notifications

### 23. Notifications Collection

```typescript
export interface INotification extends Document {
  recipient: {
    id: Types.ObjectId;
    name: string;
    email: string;
  };
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ALERT';
  category: 'MEAL' | 'INVENTORY' | 'PROCUREMENT' | 'APPROVAL' | 'SYSTEM';
  title: string;
  message: string;
  metadata?: {
    referenceType?: string; // 'GuestMeal', 'PurchaseOrder', etc.
    referenceId?: Types.ObjectId;
    actionUrl?: string;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  deliveryStatus: {
    inApp?: 'PENDING' | 'DELIVERED' | 'READ';
    email?: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
    sms?: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  };
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
      email: String,
    },
    type: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ALERT'],
      required: true,
    },
    category: {
      type: String,
      enum: ['MEAL', 'INVENTORY', 'PROCUREMENT', 'APPROVAL', 'SYSTEM'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      referenceType: String,
      referenceId: Schema.Types.ObjectId,
      actionUrl: String,
    },
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },
    deliveryStatus: {
      inApp: {
        type: String,
        enum: ['PENDING', 'DELIVERED', 'READ'],
        default: 'PENDING',
      },
      email: {
        type: String,
        enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'],
      },
      sms: {
        type: String,
        enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'],
      },
    },
    readAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

notificationSchema.index({ 'recipient.id': 1, createdAt: -1 });
notificationSchema.index({ 'recipient.id': 1, 'deliveryStatus.inApp': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
```

### 24. Audit Logs Collection

```typescript
export interface IAuditLog extends Document {
  user: {
    id: Types.ObjectId;
    email: string;
    name: string;
    role: string;
  };
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', etc.
  resource: string; // 'Employee', 'MealTransaction', 'PurchaseOrder', etc.
  resourceId?: Types.ObjectId;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: {
    ip: string;
    userAgent: string;
    method: string; // HTTP method
    endpoint: string;
  };
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      email: String,
      name: String,
      role: String,
    },
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: Schema.Types.ObjectId,
    changes: [{
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
    }],
    metadata: {
      ip: String,
      userAgent: String,
      method: String,
      endpoint: String,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
    },
    errorMessage: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We use custom timestamp field
  }
);

auditLogSchema.index({ 'user.id': 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index - keep 5 years of audit logs
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 157680000 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
```

---

## Integration & System

### 25. Devices Collection

```typescript
export interface IDevice extends Document {
  deviceId: string;
  deviceName: string;
  deviceType: 'FACE_RECOGNITION' | 'BARCODE_SCANNER' | 'KIOSK';
  location: string;
  ipAddress?: string;
  macAddress?: string;
  manufacturer?: string;
  model?: string;
  firmwareVersion?: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  lastHeartbeat?: Date;
  configuration?: {
    verificationThreshold?: number;
    timeout?: number;
    displaySettings?: any;
  };
  statistics?: {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    lastVerificationAt?: Date;
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ['FACE_RECOGNITION', 'BARCODE_SCANNER', 'KIOSK'],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    ipAddress: String,
    macAddress: String,
    manufacturer: String,
    model: String,
    firmwareVersion: String,
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'],
      default: 'OFFLINE',
    },
    lastHeartbeat: Date,
    configuration: {
      verificationThreshold: Number,
      timeout: Number,
      displaySettings: Schema.Types.Mixed,
    },
    statistics: {
      totalVerifications: {
        type: Number,
        default: 0,
      },
      successfulVerifications: {
        type: Number,
        default: 0,
      },
      failedVerifications: {
        type: Number,
        default: 0,
      },
      lastVerificationAt: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ deviceId: 1 }, { unique: true });
deviceSchema.index({ status: 1 });

export const Device = mongoose.model<IDevice>('Device', deviceSchema);
```

### 26. System Settings Collection

```typescript
export interface ISystemSetting extends Document {
  key: string;
  value: any;
  category: 'GENERAL' | 'MEAL' | 'INVENTORY' | 'PROCUREMENT' | 'INTEGRATION';
  description?: string;
  dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
  isEditable: boolean;
  updatedBy?: {
    id: Types.ObjectId;
    name: string;
  };
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    category: {
      type: String,
      enum: ['GENERAL', 'MEAL', 'INVENTORY', 'PROCUREMENT', 'INTEGRATION'],
      required: true,
    },
    description: String,
    dataType: {
      type: String,
      enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY'],
      required: true,
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

systemSettingSchema.index({ key: 1 }, { unique: true });
systemSettingSchema.index({ category: 1 });

export const SystemSetting = mongoose.model<ISystemSetting>(
  'SystemSetting',
  systemSettingSchema
);
```

---

## Indexes & Performance

### Critical Indexes Summary

```javascript
// High-volume collections requiring special attention

// MealTransactions (18,000+ docs/day)
db.mealtransactions.createIndex({ date: -1, "mealSession.id": 1 });
db.mealtransactions.createIndex({ "employee.id": 1, date: -1 });
db.mealtransactions.createIndex({ "department.id": 1, date: -1 });
db.mealtransactions.createIndex({ timestamp: -1 });

// EmployeeAttendance (cached data)
db.employeeattendances.createIndex({ employeeId: 1, date: 1 }, { unique: true });
db.employeeattendances.createIndex({ date: -1 });

// StockMovements (high-volume)
db.stockmovements.createIndex({ "item.id": 1, date: -1 });
db.stockmovements.createIndex({ date: -1 });

// Notifications (user-centric)
db.notifications.createIndex({ "recipient.id": 1, createdAt: -1 });
db.notifications.createIndex({ "recipient.id": 1, "deliveryStatus.inApp": 1 });

// AuditLogs (compliance)
db.auditlogs.createIndex({ "user.id": 1, timestamp: -1 });
db.auditlogs.createIndex({ resource: 1, resourceId: 1, timestamp: -1 });
```

### Compound Index Strategy

1. **Most selective field first:** Status fields, dates, IDs
2. **Sort fields last:** If query sorts on a field, put it last in compound index
3. **Equality, Sort, Range (ESR):** Follow this order in compound indexes

### TTL Indexes for Data Lifecycle

```javascript
// Auto-delete old sessions (1 hour)
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Auto-delete old attendance cache (90 days)
db.employeeattendances.createIndex({ date: 1 }, { expireAfterSeconds: 7776000 });

// Keep meal transactions for 5 years
db.mealtransactions.createIndex({ date: 1 }, { expireAfterSeconds: 157680000 });

// Auto-delete expired notifications
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## Summary

### Total Collections: 26

**Authentication & Users:** 2
**Employee Management:** 5
**Meal Management:** 4
**Inventory Management:** 6
**Procurement & Financial:** 5
**Reporting & Notifications:** 2
**Integration & System:** 2

### Key Design Features

1. **Denormalization:** Employee names, department names stored in transaction docs
2. **Soft Deletes:** All entities use `isDeleted` flag
3. **Audit Trail:** `createdBy`, `updatedBy`, timestamps on all entities
4. **Embedded Documents:** Used for one-to-few relationships (approval workflows, items arrays)
5. **References:** Used for one-to-many, many-to-many relationships
6. **Computed Fields:** Calculated in middleware (variance, totalAmount, balanceAmount)
7. **TTL Indexes:** Auto-cleanup of old data
8. **Text Indexes:** Full-text search on names, codes
9. **Compound Indexes:** Optimized for common query patterns

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Next Review:** Before Phase 1 database setup
