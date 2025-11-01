import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IStockMovement extends Document {
  _id: Types.ObjectId;
  item: {
    id: Types.ObjectId;
    itemCode: string;
    name: string;
  };
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  quantity: number;
  unit: string;
  fromLocation?: string;
  toLocation?: string;
  referenceType?: 'PURCHASE_ORDER' | 'CONSUMPTION' | 'MANUAL' | 'TRANSFER' | 'RETURN' | 'RECONCILIATION';
  referenceId?: string;
  referenceNumber?: string;
  costPerUnit?: number;
  totalCost?: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  notes?: string;
  performedBy: {
    id: Types.ObjectId;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: Types.ObjectId;
    name: string;
    email: string;
    approvedAt: Date;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  transactionDate: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    item: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
      },
      itemCode: {
        type: String,
        required: true,
        uppercase: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    movementType: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      uppercase: true,
    },
    fromLocation: String,
    toLocation: String,
    referenceType: {
      type: String,
      enum: ['PURCHASE_ORDER', 'CONSUMPTION', 'MANUAL', 'TRANSFER', 'RETURN', 'RECONCILIATION'],
    },
    referenceId: String,
    referenceNumber: String,
    costPerUnit: {
      type: Number,
      min: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
    },
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },
    reason: String,
    notes: String,
    performedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    approvedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      email: String,
      approvedAt: Date,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'COMPLETED',
    },
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
stockMovementSchema.index({ 'item.id': 1, transactionDate: -1 });
stockMovementSchema.index({ movementType: 1, status: 1 });
stockMovementSchema.index({ transactionDate: -1 });
stockMovementSchema.index({ 'performedBy.id': 1 });
stockMovementSchema.index({ referenceType: 1, referenceId: 1 });

// Middleware to calculate total cost
stockMovementSchema.pre('save', function (next) {
  if (this.costPerUnit && this.quantity) {
    this.totalCost = Math.abs(this.quantity) * this.costPerUnit;
  }
  next();
});

// Middleware to exclude deleted documents
stockMovementSchema.pre(/^find/, function (next) {
  // Only filter if not explicitly querying for deleted items
  const query = (this as any).getFilter();
  if (!('isDeleted' in query)) {
    (this as any).where({ isDeleted: false });
  }
  next();
});

const StockMovement: Model<IStockMovement> =
  mongoose.models.StockMovement ||
  mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);

export default StockMovement;
