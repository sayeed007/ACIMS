import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IPurchaseDemandItem {
  item: {
    id: Types.ObjectId
    itemCode: string
    name: string
  }
  currentStock: number
  requiredQuantity: number
  demandedQuantity: number
  unit: string
  suggestedVendors?: Types.ObjectId[]
  remarks?: string
}

export interface IApprovalWorkflow {
  approver: {
    id: Types.ObjectId
    name: string
    role: string
  }
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedAt?: Date
  comments?: string
}

export interface IPurchaseDemand extends Document {
  _id: Types.ObjectId
  demandNumber: string
  demandDate: Date
  requiredByDate: Date
  generationType: 'AUTO' | 'MANUAL'
  basedOnCommitments?: {
    startDate: Date
    endDate: Date
    mealSessions: Types.ObjectId[]
  }
  items: IPurchaseDemandItem[]
  createdBy: {
    id: Types.ObjectId
    name: string
    email: string
  }
  approvalWorkflow: IApprovalWorkflow[]
  finalStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PO_CREATED'
  purchaseOrderReference?: Types.ObjectId
  notes?: string
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const purchaseDemandSchema = new Schema<IPurchaseDemand>(
  {
    demandNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    demandDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    requiredByDate: {
      type: Date,
      required: true,
    },
    generationType: {
      type: String,
      enum: ['AUTO', 'MANUAL'],
      required: true,
      default: 'MANUAL',
    },
    basedOnCommitments: {
      startDate: Date,
      endDate: Date,
      mealSessions: [
        {
          type: Schema.Types.ObjectId,
          ref: 'MealSession',
        },
      ],
    },
    items: [
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
        currentStock: {
          type: Number,
          default: 0,
        },
        requiredQuantity: {
          type: Number,
          required: true,
          min: 0,
        },
        demandedQuantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unit: {
          type: String,
          required: true,
        },
        suggestedVendors: [
          {
            type: Schema.Types.ObjectId,
            ref: 'Vendor',
          },
        ],
        remarks: String,
      },
    ],
    createdBy: {
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
    approvalWorkflow: [
      {
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
      },
    ],
    finalStatus: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PO_CREATED'],
      default: 'DRAFT',
      required: true,
    },
    purchaseOrderReference: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    notes: {
      type: String,
      trim: true,
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

// Indexes
// demandNumber already has unique: true, so no need to create another index
purchaseDemandSchema.index({ demandDate: -1 })
purchaseDemandSchema.index({ finalStatus: 1 })
purchaseDemandSchema.index({ 'createdBy.id': 1 })
purchaseDemandSchema.index({ isDeleted: 1 })
purchaseDemandSchema.index({ requiredByDate: 1 })

const PurchaseDemand =
  mongoose.models.PurchaseDemand ||
  mongoose.model<IPurchaseDemand>('PurchaseDemand', purchaseDemandSchema)

export default PurchaseDemand
