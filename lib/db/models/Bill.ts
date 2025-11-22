import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IBillItem {
  description: string
  item?: {
    id: Types.ObjectId
    itemCode: string
    name: string
  }
  quantity?: number
  unit?: string
  rate: number
  amount: number
}

export interface IBill extends Document {
  _id: Types.ObjectId
  billNumber: string
  billDate: Date
  dueDate: Date
  vendor: {
    id: Types.ObjectId
    vendorCode: string
    name: string
  }
  purchaseOrderReference?: Types.ObjectId
  receiptReferences?: Types.ObjectId[]
  items: IBillItem[]
  subtotal: number
  tax: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  billDocument?: string
  enteredBy: {
    id: Types.ObjectId
    name: string
    email: string
  }
  verifiedBy?: {
    id: Types.ObjectId
    name: string
    verifiedAt: Date
  }
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID'
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED'
  notes?: string
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const billSchema = new Schema<IBill>(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    billDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
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
    },
    purchaseOrderReference: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    receiptReferences: [
      {
        type: Schema.Types.ObjectId,
        ref: 'StockReceipt',
      },
    ],
    items: [
      {
        description: {
          type: String,
          required: true,
        },
        item: {
          id: {
            type: Schema.Types.ObjectId,
            ref: 'InventoryItem',
          },
          itemCode: String,
          name: String,
        },
        quantity: Number,
        unit: String,
        rate: {
          type: Number,
          required: true,
          min: 0,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    billDocument: String, // URL to uploaded document
    enteredBy: {
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
      verifiedAt: Date,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID'],
      default: 'UNPAID',
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED'],
      default: 'DRAFT',
      required: true,
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

// Pre-save middleware to calculate amounts and payment status
billSchema.pre('save', function (next) {
  // Calculate balance amount
  this.balanceAmount = this.totalAmount - this.paidAmount

  // Update payment status based on amounts
  if (this.paidAmount === 0) {
    this.paymentStatus = 'UNPAID'
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'FULLY_PAID'
  } else {
    this.paymentStatus = 'PARTIALLY_PAID'
  }

  // Calculate subtotal if items exist
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0)
  }

  next()
})

// Indexes
// billNumber already has unique: true, so no need to create another index
billSchema.index({ billDate: -1 })
billSchema.index({ dueDate: 1 })
billSchema.index({ paymentStatus: 1 })
billSchema.index({ status: 1 })
billSchema.index({ 'vendor.id': 1 })
billSchema.index({ isDeleted: 1 })

const Bill = mongoose.models.Bill || mongoose.model<IBill>('Bill', billSchema)

export default Bill
