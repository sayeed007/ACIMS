import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INumberSequence extends Document {
  entityType: 'BILL' | 'DEMAND' | 'PURCHASE_ORDER' | 'STOCK_MOVEMENT' | 'EMPLOYEE' | 'VENDOR';
  prefix: string;
  length: number;
  currentNumber: number;
  format: string; // e.g., "{PREFIX}-{NUMBER}"
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const numberSequenceSchema = new Schema<INumberSequence>(
  {
    entityType: {
      type: String,
      enum: ['BILL', 'DEMAND', 'PURCHASE_ORDER', 'STOCK_MOVEMENT', 'EMPLOYEE', 'VENDOR'],
      required: true,
      unique: true,
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    length: {
      type: Number,
      required: true,
      min: 3,
      max: 10,
      default: 6,
    },
    currentNumber: {
      type: Number,
      required: true,
      default: 0,
    },
    format: {
      type: String,
      required: true,
      default: '{PREFIX}-{NUMBER}',
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
numberSequenceSchema.index({ entityType: 1 });

const NumberSequence: Model<INumberSequence> =
  mongoose.models.NumberSequence || mongoose.model<INumberSequence>('NumberSequence', numberSequenceSchema);

export default NumberSequence;
