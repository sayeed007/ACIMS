import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IEmployeeAttendance extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  employee: {
    id: string;
    name: string;
  };
  date: Date;
  shift: {
    id: Types.ObjectId;
    name: string;
  };
  status: 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'HALF_DAY' | 'LATE';
  checkIn?: Date;
  checkOut?: Date;
  overtimeHours?: number;
  isOTApproved: boolean;
  syncedFrom: 'PERMANENT_HRMS' | 'VENDOR_HRMS';
  lastSyncedAt: Date;
}

const employeeAttendanceSchema = new Schema<IEmployeeAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    employee: {
      id: String,
      name: String,
    },
    date: {
      type: Date,
      required: true,
    },
    shift: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Shift',
      },
      name: String,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'ON_LEAVE', 'HALF_DAY', 'LATE'],
      required: true,
    },
    checkIn: Date,
    checkOut: Date,
    overtimeHours: {
      type: Number,
      default: 0,
    },
    isOTApproved: {
      type: Boolean,
      default: false,
    },
    syncedFrom: {
      type: String,
      enum: ['PERMANENT_HRMS', 'VENDOR_HRMS'],
      required: true,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for unique constraint and fast lookups
// employeeAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
employeeAttendanceSchema.index({ date: -1 });
employeeAttendanceSchema.index({ status: 1, date: -1 });

// TTL index - keep only 90 days of attendance data
employeeAttendanceSchema.index({ date: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const EmployeeAttendance: Model<IEmployeeAttendance> =
  mongoose.models.EmployeeAttendance ||
  mongoose.model<IEmployeeAttendance>('EmployeeAttendance', employeeAttendanceSchema);

export default EmployeeAttendance;
