import mongoose from 'mongoose';
import {
  baseSchemaOptions,
  internalAuditSchema,
  locationSchema,
  sanitizedString,
} from './schema-helpers.js';

const affiliateKycAssetSchema = new mongoose.Schema(
  {
    telegramFileId: sanitizedString(255, { default: '', select: false }),
    telegramFileUniqueId: sanitizedString(255, { default: '', select: false }),
    telegramFileType: {
      type: String,
      enum: ['photo', 'document'],
      default: 'photo',
      select: false,
    },
    mimeType: sanitizedString(120, { default: '', select: false }),
    fileName: sanitizedString(180, { default: '', select: false }),
    submittedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { _id: false },
);

const affiliateProfileSchema = new mongoose.Schema(
  {
    // One affiliate profile per user keeps referral ownership unambiguous.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    affiliateCode: sanitizedString(24, {
      required: true,
      unique: true,
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
    kycDetails: {
      legalPhoneNumber: sanitizedString(30, { default: '', select: false }),
      country: sanitizedString(80, { default: '', select: false }),
      city: sanitizedString(80, { default: '', select: false }),
      idDocument: {
        type: affiliateKycAssetSchema,
        default: () => ({}),
      },
      selfieWithId: {
        type: affiliateKycAssetSchema,
        default: () => ({}),
      },
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
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
