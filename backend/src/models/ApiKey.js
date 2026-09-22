import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    keyHash: { type: String, required: true, unique: true, select: false },
    prefix: { type: String, required: true, maxlength: 8 },
    expiresAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

apiKeySchema.index({ userId: 1, revokedAt: 1, createdAt: -1 });

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
