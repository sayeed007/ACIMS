import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: Types.ObjectId;
  parentDepartment?: Types.ObjectId;
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: String,
    headOfDepartment: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    parentDepartment: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
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
  }
);

// Indexes
// departmentSchema.index({ code: 1 }, { unique: true });
// departmentSchema.index({ name: 1 });
departmentSchema.index({ status: 1 });
departmentSchema.index({ headOfDepartment: 1 });

// Middleware
departmentSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

const Department: Model<IDepartment> =
  mongoose.models.Department || mongoose.model<IDepartment>('Department', departmentSchema);

export default Department;
