import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  refreshToken: string;
  device: {
    userAgent: string;
    ip: string;
    platform?: string;
    browser?: string;
  };
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    device: {
      userAgent: String,
      ip: String,
      platform: String,
      browser: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
sessionSchema.index({ userId: 1 });
// sessionSchema.index({ token: 1 });
// sessionSchema.index({ refreshToken: 1 });
// TTL index - auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);

export default Session;
