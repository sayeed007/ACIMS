import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IEmployee extends Document {
  _id: Types.ObjectId;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  department: {
    id: Types.ObjectId;
    name: string;
  };
  shift: {
    id: Types.ObjectId;
    name: string;
  };
  employmentType: 'PERMANENT' | 'VENDOR' | 'CONTRACT' | 'TEMPORARY';
  designation?: string;
  joiningDate: Date;
  exitDate?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  mealEligibility: {
    enabled: boolean;
    restrictedMeals?: Types.ObjectId[];
    specialMeals?: Types.ObjectId[];
  };
  biometricData: {
    faceTemplateId?: string;
    faceDataSynced: boolean;
    lastSyncedAt?: Date;
  };
  hrmsData: {
    systemType: 'PERMANENT_HRMS' | 'VENDOR_HRMS';
    externalId: string;
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
      sparse: true,
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
      select: false,
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
// employeeSchema.index({ employeeId: 1 }, { unique: true });
employeeSchema.index({ 'department.id': 1, status: 1 });
employeeSchema.index({ 'shift.id': 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ employmentType: 1 });
employeeSchema.index({ 'hrmsData.externalId': 1 });
employeeSchema.index({ name: 'text', employeeId: 'text' });

// Middleware
employeeSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>('Employee', employeeSchema);

export default Employee;
