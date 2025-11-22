import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IMealTransaction extends Document {
  _id: Types.ObjectId;
  transactionId: string;
  date: Date;
  mealSession: {
    id: Types.ObjectId;
    name: string;
    code: string;
  };
  employee: {
    id: Types.ObjectId;
    employeeId: string;
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
    id: string;
    name: string;
    location?: string;
  };
  verificationMethod: 'FACE_RECOGNITION' | 'MANUAL' | 'GUEST';
  verificationStatus: 'AUTHORIZED' | 'UNAUTHORIZED' | 'OVERRIDE';
  verificationConfidence?: number;
  eligibilityCheck: {
    wasEligible: boolean;
    attendanceStatus: 'PRESENT' | 'ABSENT' | 'NOT_CHECKED';
    shiftMatch: boolean;
    overtimeApproved?: boolean;
    failureReason?: string;
  };
  isGuestMeal: boolean;
  guestMealReference?: Types.ObjectId;
  authorizedBy?: {
    id: Types.ObjectId;
    name: string;
  };
  timestamp: Date;
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
      // Removed index: true - date is already indexed in compound and TTL indexes below
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
      select: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Critical indexes for performance
// mealTransactionSchema.index({ transactionId: 1 }, { unique: true });
mealTransactionSchema.index({ date: -1, 'mealSession.id': 1 });
mealTransactionSchema.index({ 'employee.id': 1, date: -1 });
mealTransactionSchema.index({ 'department.id': 1, date: -1 });
mealTransactionSchema.index({ timestamp: -1 });
mealTransactionSchema.index({ verificationStatus: 1, date: -1 });

// TTL index - keep 5 years of data
mealTransactionSchema.index({ date: 1 }, { expireAfterSeconds: 157680000 }); // 5 years

// Middleware
mealTransactionSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

const MealTransaction: Model<IMealTransaction> =
  mongoose.models.MealTransaction ||
  mongoose.model<IMealTransaction>('MealTransaction', mealTransactionSchema);

export default MealTransaction;
