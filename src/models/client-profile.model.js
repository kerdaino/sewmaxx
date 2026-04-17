import mongoose from 'mongoose';
import {
  baseSchemaOptions,
  internalAuditSchema,
  locationSchema,
  sanitizedString,
  sanitizedStringArray,
} from './schema-helpers.js';

const clientProfileSchema = new mongoose.Schema(
  {
    // Client data stays separate from the base user record to reduce accidental cross-role writes.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: sanitizedString(120, { required: true }),
    phoneNumber: sanitizedString(30, { default: '', select: false }),
    location: {
      type: locationSchema,
      required: true,
    },
    referredByAffiliateProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AffiliateProfile',
      default: null,
      index: true,
    },
    stylePreferences: sanitizedStringArray(40, 15),
    notes: sanitizedString(300, { default: '' }),
    onboardingCompletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    internalAudit: {
      type: internalAuditSchema,
      default: () => ({}),
    },
  },
  baseSchemaOptions,
);

clientProfileSchema.index({ 'location.city': 1 });
clientProfileSchema.index({ referredByAffiliateProfileId: 1, createdAt: -1 });

export const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);
