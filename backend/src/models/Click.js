import mongoose from 'mongoose';

// Raw click events are deleted automatically by MongoDB after this long.
const RETENTION_SECONDS = 365 * 24 * 60 * 60;

export const DEVICE_TYPES = ['desktop', 'mobile', 'tablet', 'bot', 'other'];

// One document = one visit to a short link.
// Privacy: we never store the visitor's IP address or their full browser text (user-agent).
const clickSchema = new mongoose.Schema(
  {
    urlId: { type: mongoose.Schema.Types.ObjectId, ref: 'Url', required: true },
    ts: { type: Date, required: true, default: Date.now },
    referrerHost: { type: String, trim: true, lowercase: true, maxlength: 253, default: 'direct' },
    deviceType: { type: String, enum: DEVICE_TYPES, default: 'other' },
    browser: { type: String, trim: true, maxlength: 50 },
    os: { type: String, trim: true, maxlength: 50 },
    country: { type: String, uppercase: true, match: /^[A-Z]{2}$/ },
    isBot: { type: Boolean, required: true, default: false },
  },
  { versionKey: false },
);

// Makes "clicks for one link over a time range" fast.
clickSchema.index({ urlId: 1, ts: -1 });
// Automatic clean-up of old events.
clickSchema.index({ ts: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

export const Click = mongoose.model('Click', clickSchema);