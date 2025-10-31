import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IShift extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  startTime: string;
  endTime: string;
  gracePeriod?: {
    entry: number;
    exit: number;
  };
  mealEligibility: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
  };
  eligibleMealSessions: Types.ObjectId[];
  overtimeThreshold?: number;
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
    description: {
      type: String,
      trim: true,
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
    gracePeriod: {
      entry: {
        type: Number,
        default: 15,
      },
      exit: {
        type: Number,
        default: 15,
      },
    },
    mealEligibility: {
      breakfast: {
        type: Boolean,
        default: true,
      },
      lunch: {
        type: Boolean,
        default: true,
      },
      dinner: {
        type: Boolean,
        default: false,
      },
      snacks: {
        type: Boolean,
        default: false,
      },
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
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// shiftSchema.index({ code: 1 }, { unique: true });
shiftSchema.index({ status: 1 });

// Middleware
shiftSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

const Shift: Model<IShift> =
  mongoose.models.Shift || mongoose.model<IShift>('Shift', shiftSchema);

export default Shift;
