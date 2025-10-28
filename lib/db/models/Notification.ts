import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: {
    id: Types.ObjectId;
    name: string;
    email: string;
  };
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ALERT';
  category: 'MEAL' | 'INVENTORY' | 'PROCUREMENT' | 'APPROVAL' | 'SYSTEM';
  title: string;
  message: string;
  metadata?: {
    referenceType?: string;
    referenceId?: Types.ObjectId;
    actionUrl?: string;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  deliveryStatus: {
    inApp?: 'PENDING' | 'DELIVERED' | 'READ';
    email?: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
    sms?: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  };
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
      email: String,
    },
    type: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ALERT'],
      required: true,
    },
    category: {
      type: String,
      enum: ['MEAL', 'INVENTORY', 'PROCUREMENT', 'APPROVAL', 'SYSTEM'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      referenceType: String,
      referenceId: Schema.Types.ObjectId,
      actionUrl: String,
    },
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },
    deliveryStatus: {
      inApp: {
        type: String,
        enum: ['PENDING', 'DELIVERED', 'READ'],
        default: 'PENDING',
      },
      email: {
        type: String,
        enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'],
      },
      sms: {
        type: String,
        enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'],
      },
    },
    readAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
notificationSchema.index({ 'recipient.id': 1, createdAt: -1 });
notificationSchema.index({ 'recipient.id': 1, 'deliveryStatus.inApp': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
