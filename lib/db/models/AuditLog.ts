import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  user: {
    id: Types.ObjectId;
    email: string;
    name: string;
    role: string;
  };
  action: string;
  resource: string;
  resourceId?: Types.ObjectId;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: {
    ip: string;
    userAgent: string;
    method: string;
    endpoint: string;
  };
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      email: String,
      name: String,
      role: String,
    },
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: Schema.Types.ObjectId,
    changes: [{
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
    }],
    metadata: {
      ip: String,
      userAgent: String,
      method: String,
      endpoint: String,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
    },
    errorMessage: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
auditLogSchema.index({ 'user.id': 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index - keep 5 years of audit logs
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 157680000 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
