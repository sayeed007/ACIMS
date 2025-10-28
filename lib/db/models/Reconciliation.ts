import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IReconciliation extends Document {
  _id: Types.ObjectId
  item: {
    id: Types.ObjectId
    itemCode: string
    name: string
  }
  systemStock: number
  physicalStock: number
  discrepancy: number
  discrepancyPercentage: number
  unit: string
  reconciliationDate: Date
  location?: string
  reason?: string
  notes?: string
  performedBy: {
    id: Types.ObjectId
    name: string
    email: string
  }
  verifiedBy?: {
    id: Types.ObjectId
    name: string
    email: string
    verifiedAt: Date
  }
  approvedBy?: {
    id: Types.ObjectId
    name: string
    email: string
    approvedAt: Date
  }
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  adjustmentReference?: {
    movementId: Types.ObjectId
    movementType: string
    adjustmentApplied: boolean
  }
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const reconciliationSchema = new Schema<IReconciliation>(
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
      },
      name: {
        type: String,
        required: true,
      },
    },
    systemStock: {
      type: Number,
      required: true,
      min: 0,
    },
    physicalStock: {
      type: Number,
      required: true,
      min: 0,
    },
    discrepancy: {
      type: Number,
      required: true,
    },
    discrepancyPercentage: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    reconciliationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    location: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
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
    verifiedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      email: String,
      verifiedAt: Date,
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
      enum: ['DRAFT', 'SUBMITTED', 'VERIFIED', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'DRAFT',
      required: true,
    },
    adjustmentReference: {
      movementId: {
        type: Schema.Types.ObjectId,
        ref: 'StockMovement',
      },
      movementType: String,
      adjustmentApplied: {
        type: Boolean,
        default: false,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Pre-save middleware to calculate discrepancy
reconciliationSchema.pre('save', function (next) {
  if (this.isModified('systemStock') || this.isModified('physicalStock')) {
    this.discrepancy = this.physicalStock - this.systemStock

    // Calculate discrepancy percentage
    if (this.systemStock > 0) {
      this.discrepancyPercentage = (this.discrepancy / this.systemStock) * 100
    } else {
      this.discrepancyPercentage = this.physicalStock > 0 ? 100 : 0
    }
  }
  next()
})

// Indexes
reconciliationSchema.index({ 'item.id': 1, reconciliationDate: -1 })
reconciliationSchema.index({ status: 1 })
reconciliationSchema.index({ reconciliationDate: -1 })
reconciliationSchema.index({ isDeleted: 1 })
reconciliationSchema.index({ 'performedBy.id': 1 })

const Reconciliation =
  mongoose.models.Reconciliation ||
  mongoose.model<IReconciliation>('Reconciliation', reconciliationSchema)

export default Reconciliation
