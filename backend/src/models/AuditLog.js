import mongoose from 'mongoose';

// One document = one recorded change to a link's destination.
const auditLogSchema = new mongoose.Schema(
  {
    urlId: { type: mongoose.Schema.Types.ObjectId, ref: 'Url', required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. 'destination_changed'
    before: { type: String },
    after: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

auditLogSchema.index({ urlId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);