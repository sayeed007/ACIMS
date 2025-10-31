import mongoose, { Document, Schema, Types } from 'mongoose'

export type Permission =
  | 'employees:view' | 'employees:create' | 'employees:update' | 'employees:delete'
  | 'departments:view' | 'departments:create' | 'departments:update' | 'departments:delete'
  | 'shifts:view' | 'shifts:create' | 'shifts:update' | 'shifts:delete'
  | 'meals:view' | 'meals:create' | 'meals:update' | 'meals:delete'
  | 'meal-sessions:view' | 'meal-sessions:create' | 'meal-sessions:update' | 'meal-sessions:delete'
  | 'inventory:view' | 'inventory:create' | 'inventory:update' | 'inventory:delete'
  | 'procurement:view' | 'procurement:create' | 'procurement:update' | 'procurement:delete'
  | 'reports:view' | 'reports:export'
  | 'settings:view' | 'settings:update'
  | 'users:view' | 'users:create' | 'users:update' | 'users:delete'
  | 'eligibility:view' | 'eligibility:create' | 'eligibility:update' | 'eligibility:delete'
  | 'approve:demands' | 'approve:reconciliations' | 'approve:guest-meals'

export interface IAccessControlRule extends Document {
  _id: Types.ObjectId
  roleName: string
  description?: string
  permissions: Permission[]
  moduleAccess: {
    dashboard: boolean
    employees: boolean
    departments: boolean
    shifts: boolean
    mealSessions: boolean
    mealTransactions: boolean
    inventory: boolean
    procurement: boolean
    reports: boolean
    settings: boolean
    eligibility: boolean
  }
  dataScope: {
    type: 'ALL' | 'DEPARTMENT' | 'OWN'
    departments?: Types.ObjectId[] // If type is DEPARTMENT
  }
  restrictions?: {
    maxBulkOperations?: number
    canExport?: boolean
    canDelete?: boolean
    canApprove?: boolean
  }
  isSystemRole: boolean // Cannot be deleted if true
  isActive: boolean
  createdBy: {
    id: Types.ObjectId
    name: string
    email: string
  }
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const accessControlRuleSchema = new Schema<IAccessControlRule>(
  {
    roleName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          'employees:view', 'employees:create', 'employees:update', 'employees:delete',
          'departments:view', 'departments:create', 'departments:update', 'departments:delete',
          'shifts:view', 'shifts:create', 'shifts:update', 'shifts:delete',
          'meals:view', 'meals:create', 'meals:update', 'meals:delete',
          'meal-sessions:view', 'meal-sessions:create', 'meal-sessions:update', 'meal-sessions:delete',
          'inventory:view', 'inventory:create', 'inventory:update', 'inventory:delete',
          'procurement:view', 'procurement:create', 'procurement:update', 'procurement:delete',
          'reports:view', 'reports:export',
          'settings:view', 'settings:update',
          'users:view', 'users:create', 'users:update', 'users:delete',
          'eligibility:view', 'eligibility:create', 'eligibility:update', 'eligibility:delete',
          'approve:demands', 'approve:reconciliations', 'approve:guest-meals',
        ],
      },
    ],
    moduleAccess: {
      dashboard: {
        type: Boolean,
        default: true,
      },
      employees: {
        type: Boolean,
        default: false,
      },
      departments: {
        type: Boolean,
        default: false,
      },
      shifts: {
        type: Boolean,
        default: false,
      },
      mealSessions: {
        type: Boolean,
        default: false,
      },
      mealTransactions: {
        type: Boolean,
        default: false,
      },
      inventory: {
        type: Boolean,
        default: false,
      },
      procurement: {
        type: Boolean,
        default: false,
      },
      reports: {
        type: Boolean,
        default: false,
      },
      settings: {
        type: Boolean,
        default: false,
      },
      eligibility: {
        type: Boolean,
        default: false,
      },
    },
    dataScope: {
      type: {
        type: String,
        enum: ['ALL', 'DEPARTMENT', 'OWN'],
        default: 'OWN',
        required: true,
      },
      departments: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Department',
        },
      ],
    },
    restrictions: {
      maxBulkOperations: {
        type: Number,
        min: 1,
      },
      canExport: {
        type: Boolean,
        default: false,
      },
      canDelete: {
        type: Boolean,
        default: false,
      },
      canApprove: {
        type: Boolean,
        default: false,
      },
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
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

// Indexes
accessControlRuleSchema.index({ roleName: 1 })
accessControlRuleSchema.index({ isActive: 1 })
accessControlRuleSchema.index({ isDeleted: 1 })
accessControlRuleSchema.index({ isSystemRole: 1 })

const AccessControlRule =
  mongoose.models.AccessControlRule ||
  mongoose.model<IAccessControlRule>('AccessControlRule', accessControlRuleSchema)

export default AccessControlRule
