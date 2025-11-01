import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IInventoryItem extends Document {
  _id: Types.ObjectId;
  itemCode: string;
  name: string;
  description?: string;
  category: {
    id: Types.ObjectId;
    name: string;
  };
  unit: string;
  alternateUnits?: {
    unit: string;
    conversionFactor: number;
  }[];
  currentStock: number;
  reorderLevel: number;
  reorderQuantity?: number;
  avgCostPerUnit: number;
  totalValue: number;
  vendors: Types.ObjectId[];
  storageLocation?: string;
  shelfLife?: number;
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
    shelfLife: Number,
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
      default: 'ACTIVE',
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// inventoryItemSchema.index({ itemCode: 1 }, { unique: true });
inventoryItemSchema.index({ 'category.id': 1, status: 1 });
inventoryItemSchema.index({ status: 1, currentStock: 1 });
inventoryItemSchema.index({ name: 'text', itemCode: 'text' });

// Virtual for low stock status
inventoryItemSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.reorderLevel;
});

// Middleware to update total value
inventoryItemSchema.pre('save', function (next) {
  this.totalValue = this.currentStock * this.avgCostPerUnit;
  next();
});

// Middleware to filter out deleted items
inventoryItemSchema.pre(/^find/, function (next) {
  // Add isDeleted filter to the existing query
  const query = this.getQuery();
  if (!query.hasOwnProperty('isDeleted')) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const InventoryItem: Model<IInventoryItem> =
  mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);

export default InventoryItem;
