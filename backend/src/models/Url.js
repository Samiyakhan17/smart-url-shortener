import mongoose from 'mongoose';
import { getUrlState } from '../utils/urlState.js';

const urlSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    shortCode: { type: String, required: true, unique: true, trim: true },
    isCustomAlias: { type: Boolean, default: false },
    originalUrl: { type: String, required: true, maxlength: 2048 },
    originalHost: { type: String, required: true },
    title: { type: String, trim: true, maxlength: 100 },
    status: { type: String, enum: ['active', 'disabled', 'blocked'], default: 'active' },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    clickCount: { type: Number, default: 0, min: 0 },
    lastClickedAt: { type: Date, default: null },
    tags: { type: [String], default: [] },
    isFavorite: { type: Boolean, default: false },
    blockedReason: { type: String },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
  },
);

// Derived state: nothing has to be written to the database when a link expires.
urlSchema.virtual('state').get(function state() {
  return getUrlState(this);
});

urlSchema.index({ ownerId: 1, deletedAt: 1, createdAt: -1 });
urlSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
urlSchema.index({ ownerId: 1, clickCount: -1 });
urlSchema.index({ ownerId: 1, expiresAt: 1 });
urlSchema.index({ ownerId: 1, tags: 1 });
urlSchema.index({ ownerId: 1, isFavorite: 1 });
urlSchema.index({ originalHost: 1 });
urlSchema.index({ title: 'text', originalUrl: 'text' });

export const Url = mongoose.model('Url', urlSchema);