import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IDevice extends Document {
  _id: Types.ObjectId;
  deviceId: string;
  deviceName: string;
  deviceType: 'FACE_RECOGNITION' | 'BARCODE_SCANNER' | 'KIOSK';
  location: string;
  ipAddress?: string;
  macAddress?: string;
  manufacturer?: string;
  deviceModel?: string;
  firmwareVersion?: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  lastHeartbeat?: Date;
  configuration?: {
    verificationThreshold?: number;
    timeout?: number;
    displaySettings?: any;
  };
  statistics?: {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    lastVerificationAt?: Date;
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ['FACE_RECOGNITION', 'BARCODE_SCANNER', 'KIOSK'],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    ipAddress: String,
    macAddress: String,
    manufacturer: String,
    deviceModel: String,
    firmwareVersion: String,
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'],
      default: 'OFFLINE',
    },
    lastHeartbeat: Date,
    configuration: {
      verificationThreshold: Number,
      timeout: Number,
      displaySettings: Schema.Types.Mixed,
    },
    statistics: {
      totalVerifications: {
        type: Number,
        default: 0,
      },
      successfulVerifications: {
        type: Number,
        default: 0,
      },
      failedVerifications: {
        type: Number,
        default: 0,
      },
      lastVerificationAt: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// deviceSchema.index({ deviceId: 1 }, { unique: true });
deviceSchema.index({ status: 1 });

// Middleware
deviceSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

const Device: Model<IDevice> =
  mongoose.models.Device || mongoose.model<IDevice>('Device', deviceSchema);

export default Device;
