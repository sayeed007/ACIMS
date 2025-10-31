import mongoose, { Document, Schema, Types } from 'mongoose'

export interface ITimeWindow {
  startTime: string // Format: "HH:mm"
  endTime: string // Format: "HH:mm"
}

export interface IEligibilityRule extends Document {
  _id: Types.ObjectId
  ruleName: string
  description?: string
  mealSession: {
    id: Types.ObjectId
    name: string
  }
  applicableFor: {
    shifts?: Types.ObjectId[] // Array of shift IDs
    departments?: Types.ObjectId[] // Array of department IDs
    employeeTypes?: ('PERMANENT' | 'CONTRACT' | 'VENDOR')[]
    specificEmployees?: Types.ObjectId[] // For special cases
  }
  timeWindow?: ITimeWindow
  requiresAttendance: boolean // Must be marked present to be eligible
  requiresOT?: boolean // Only for OT meals
  maxMealsPerDay?: number
  priority: number // Higher priority rules override lower ones
  conditions?: {
    minWorkHours?: number
    shiftStartTimeBefore?: string // Shift must start before this time
    shiftStartTimeAfter?: string // Shift must start after this time
  }
  overrides?: {
    holidays?: boolean // Apply on holidays
    weekends?: boolean // Apply on weekends
    specialDays?: string[] // Array of dates in ISO format
  }
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

const eligibilityRuleSchema = new Schema<IEligibilityRule>(
  {
    ruleName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    mealSession: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'MealSession',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    applicableFor: {
      shifts: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Shift',
        },
      ],
      departments: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Department',
        },
      ],
      employeeTypes: [
        {
          type: String,
          enum: ['PERMANENT', 'CONTRACT', 'VENDOR'],
        },
      ],
      specificEmployees: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Employee',
        },
      ],
    },
    timeWindow: {
      startTime: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      endTime: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
    },
    requiresAttendance: {
      type: Boolean,
      default: true,
      required: true,
    },
    requiresOT: {
      type: Boolean,
      default: false,
    },
    maxMealsPerDay: {
      type: Number,
      min: 1,
    },
    priority: {
      type: Number,
      default: 0,
      required: true,
    },
    conditions: {
      minWorkHours: {
        type: Number,
        min: 0,
      },
      shiftStartTimeBefore: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      shiftStartTimeAfter: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
    },
    overrides: {
      holidays: {
        type: Boolean,
        default: false,
      },
      weekends: {
        type: Boolean,
        default: false,
      },
      specialDays: [String],
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

// Indexes for efficient querying
eligibilityRuleSchema.index({ 'mealSession.id': 1 })
eligibilityRuleSchema.index({ 'applicableFor.shifts': 1 })
eligibilityRuleSchema.index({ 'applicableFor.departments': 1 })
eligibilityRuleSchema.index({ isActive: 1 })
eligibilityRuleSchema.index({ isDeleted: 1 })
eligibilityRuleSchema.index({ priority: -1 })

const EligibilityRule =
  mongoose.models.EligibilityRule ||
  mongoose.model<IEligibilityRule>('EligibilityRule', eligibilityRuleSchema)

export default EligibilityRule
