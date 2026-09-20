import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken', default: null },
    userAgent: { type: String, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ familyId: 1 });
// MongoDB deletes the document automatically once expiresAt has passed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.virtual('isActive').get(function isActive() {
  return !this.revokedAt && this.expiresAt > new Date();
});

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);