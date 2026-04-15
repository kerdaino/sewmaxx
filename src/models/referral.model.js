import mongoose from 'mongoose';
import {
  baseSchemaOptions,
  internalAuditSchema,
  sanitizedString,
} from './schema-helpers.js';

const referralSchema = new mongoose.Schema(
  {
    affiliateProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AffiliateProfile',
      required: true,
      index: true,
    },
    affiliateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referralCode: sanitizedString(24, {
      required: true,
      uppercase: true,
      index: true,
    }),
    referredTelegramUserId: sanitizedString(40, {
      required: true,
      index: true,
    }),
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    referredRole: {
      type: String,
      enum: ['client', 'tailor'],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['telegram_start', 'api'],
      default: 'api',
    },
    status: {
      type: String,
      enum: ['captured', 'converted', 'cancelled'],
      default: 'captured',
      index: true,
    },
    internalAudit: {
      type: internalAuditSchema,
      default: () => ({}),
    },
  },
  baseSchemaOptions,
);

// Prevent repeated attribution of the same user/role to the same affiliate through retries or race conditions.
referralSchema.index(
  { affiliateProfileId: 1, referredTelegramUserId: 1, referredRole: 1 },
  { unique: true },
);

// Prevent the same role-specific user identity from being attached to multiple affiliates accidentally.
referralSchema.index(
  { referredTelegramUserId: 1, referredRole: 1 },
  { unique: true },
);

export const Referral = mongoose.model('Referral', referralSchema);
