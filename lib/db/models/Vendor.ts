import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IVendor extends Document {
  _id: Types.ObjectId
  vendorCode: string
  name: string
  category: 'FOOD' | 'BEVERAGE' | 'INGREDIENTS' | 'PACKAGING' | 'EQUIPMENT' | 'SERVICES' | 'OTHER'
  contactPerson: {
    name: string
    designation?: string
    phone: string
    email: string
    alternatePhone?: string
  }
  address: {
    street: string
    city: string
    state: string
    pincode: string
    country: string
  }
  businessDetails: {
    gstNumber?: string
    panNumber?: string
    registrationType?: 'REGISTERED' | 'UNREGISTERED' | 'COMPOSITION'
    businessType?: 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PRIVATE_LIMITED' | 'PUBLIC_LIMITED' | 'LLP'
  }
  bankDetails?: {
    accountName: string
    accountNumber: string
    ifscCode: string
    bankName: string
    branch: string
  }
  paymentTerms: {
    creditDays: number
    paymentMode: 'CASH' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI' | 'ONLINE'
    advancePercentage?: number
  }
  rating?: {
    quality: number // 1-5
    delivery: number // 1-5
    pricing: number // 1-5
    overall: number // calculated average
  }
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED'
  notes?: string
  createdBy: {
    id: Types.ObjectId
    name: string
    email: string
  }
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const vendorSchema = new Schema<IVendor>(
  {
    vendorCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['FOOD', 'BEVERAGE', 'INGREDIENTS', 'PACKAGING', 'EQUIPMENT', 'SERVICES', 'OTHER'],
      required: true,
    },
    contactPerson: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      designation: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      alternatePhone: {
        type: String,
        trim: true,
      },
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      pincode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        default: 'India',
        trim: true,
      },
    },
    businessDetails: {
      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
      panNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
      registrationType: {
        type: String,
        enum: ['REGISTERED', 'UNREGISTERED', 'COMPOSITION'],
      },
      businessType: {
        type: String,
        enum: ['PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'LLP'],
      },
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifscCode: {
        type: String,
        uppercase: true,
      },
      bankName: String,
      branch: String,
    },
    paymentTerms: {
      creditDays: {
        type: Number,
        default: 0,
        min: 0,
      },
      paymentMode: {
        type: String,
        enum: ['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'ONLINE'],
        default: 'NEFT',
      },
      advancePercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    rating: {
      quality: {
        type: Number,
        min: 1,
        max: 5,
      },
      delivery: {
        type: Number,
        min: 1,
        max: 5,
      },
      pricing: {
        type: Number,
        min: 1,
        max: 5,
      },
      overall: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED'],
      default: 'ACTIVE',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Pre-save middleware to calculate overall rating
vendorSchema.pre('save', function (next) {
  if (this.rating && (this.rating.quality || this.rating.delivery || this.rating.pricing)) {
    const ratings = []
    if (this.rating.quality) ratings.push(this.rating.quality)
    if (this.rating.delivery) ratings.push(this.rating.delivery)
    if (this.rating.pricing) ratings.push(this.rating.pricing)

    if (ratings.length > 0) {
      this.rating.overall = ratings.reduce((a, b) => a + b, 0) / ratings.length
    }
  }
  next()
})

// Indexes
// vendorSchema.index({ vendorCode: 1 })
// vendorSchema.index({ name: 1 })
vendorSchema.index({ category: 1 })
vendorSchema.index({ status: 1 })
vendorSchema.index({ isDeleted: 1 })
vendorSchema.index({ 'contactPerson.email': 1 })
vendorSchema.index({ 'businessDetails.gstNumber': 1 })

const Vendor =
  mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', vendorSchema)

export default Vendor
