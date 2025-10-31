import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IMealSession extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS' | 'OVERTIME_MEAL';
  startTime: string;
  endTime: string;
  isOvertimeMeal: boolean;
  eligibleShifts: Types.ObjectId[];
  allowedDepartments?: Types.ObjectId[];
  maxCapacity?: number;
  displayOrder: number;
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
    mealType: {
      type: String,
      enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'OVERTIME_MEAL'],
      required: [true, 'Meal type is required'],
      default: 'LUNCH',
    },
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
    allowedDepartments: [{
      type: Schema.Types.ObjectId,
      ref: 'Department',
    }],
    maxCapacity: {
      type: Number,
      default: 0,
    },
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
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// mealSessionSchema.index({ code: 1 }, { unique: true });
mealSessionSchema.index({ status: 1, displayOrder: 1 });

// Middleware
mealSessionSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

const MealSession: Model<IMealSession> =
  mongoose.models.MealSession || mongoose.model<IMealSession>('MealSession', mealSessionSchema);

export default MealSession;
