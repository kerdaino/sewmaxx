import mongoose from 'mongoose';
import {
  baseSchemaOptions,
  internalAuditSchema,
  locationSchema,
  sanitizedString,
} from './schema-helpers.js';

const affiliateProfileSchema = new mongoose.Schema(
  {
    // One affiliate profile per user keeps referral ownership unambiguous.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    affiliateCode: sanitizedString(24, {
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      immutable: true,
    }),
    fullName: sanitizedString(120, { required: true }),
    displayName: sanitizedString(120, { default: '' }),
    phoneNumber: sanitizedString(30, { default: '', select: false }),
    location: {
      type: locationSchema,
      default: undefined,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    referralCount: {
      type: Number,
      min: 0,
      default: 0,
    },
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

affiliateProfileSchema.index({ status: 1, verificationStatus: 1 });

export const AffiliateProfile = mongoose.model('AffiliateProfile', affiliateProfileSchema);
