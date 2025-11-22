import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IPurchaseOrderItem {
  item: {
    id: Types.ObjectId
    itemCode: string
    name: string
  }
  quantity: number
  unit: string
  ratePerUnit: number
  taxPercent: number
  taxAmount: number
  totalAmount: number
  receivedQuantity?: number
  pendingQuantity?: number
}

export interface IPurchaseOrder extends Document {
  _id: Types.ObjectId
  poNumber: string
  poDate: Date
  demandListReference?: Types.ObjectId
  vendor: {
    id: Types.ObjectId
    vendorCode: string
    name: string
    contact: string
  }
  deliveryDate: Date
  deliveryAddress?: string
  items: IPurchaseOrderItem[]
  subtotal: number
  totalTax: number
  totalAmount: number
  paymentTerms?: string
  createdBy: {
    id: Types.ObjectId
    name: string
    email: string
  }
  approvedBy?: {
    id: Types.ObjectId
    name: string
    approvedAt: Date
  }
  status: 'DRAFT' | 'APPROVED' | 'SENT_TO_VENDOR' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED'
  fulfilmentStatus: {
    receiptsGenerated: number
    totalReceived: number
    pendingAmount: number
  }
  notes?: string
  attachments?: string[]
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    poDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    demandListReference: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseDemand',
    },
    vendor: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
      },
      vendorCode: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      contact: {
        type: String,
        required: true,
      },
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    deliveryAddress: String,
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
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unit: {
          type: String,
          required: true,
        },
        ratePerUnit: {
          type: Number,
          required: true,
          min: 0,
        },
        taxPercent: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        taxAmount: {
          type: Number,
          default: 0,
        },
        totalAmount: {
          type: Number,
          default: 0,
        },
        receivedQuantity: {
          type: Number,
          default: 0,
          min: 0,
        },
        pendingQuantity: Number,
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentTerms: String,
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
      enum: ['DRAFT', 'APPROVED', 'SENT_TO_VENDOR', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED'],
      default: 'DRAFT',
      required: true,
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
      pendingAmount: {
        type: Number,
        default: 0,
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Pre-save middleware to calculate amounts
purchaseOrderSchema.pre('save', function (next) {
  // Calculate item-level amounts
  this.items.forEach((item) => {
    const itemTotal = item.quantity * item.ratePerUnit
    item.taxAmount = (itemTotal * item.taxPercent) / 100
    item.totalAmount = itemTotal + item.taxAmount
    item.pendingQuantity = item.quantity - (item.receivedQuantity || 0)
  })

  // Calculate PO totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.quantity * item.ratePerUnit, 0)
  this.totalTax = this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0)
  this.totalAmount = this.subtotal + this.totalTax

  // Calculate pending amount
  const receivedAmount = this.items.reduce(
    (sum, item) => sum + ((item.receivedQuantity || 0) * item.ratePerUnit + (item.taxAmount || 0) * ((item.receivedQuantity || 0) / item.quantity)),
    0
  )
  this.fulfilmentStatus.pendingAmount = this.totalAmount - receivedAmount

  next()
})

// Indexes
// poNumber already has unique: true, so no need to create another index
purchaseOrderSchema.index({ poDate: -1 })
purchaseOrderSchema.index({ status: 1 })
purchaseOrderSchema.index({ 'vendor.id': 1 })
purchaseOrderSchema.index({ isDeleted: 1 })
purchaseOrderSchema.index({ deliveryDate: 1 })

const PurchaseOrder =
  mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema)

export default PurchaseOrder
