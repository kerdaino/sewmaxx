import mongoose from 'mongoose';
import {
  baseSchemaOptions,
  budgetRangeSchema,
  internalAuditSchema,
  locationSchema,
  sanitizedString,
  sanitizedStringArray,
} from './schema-helpers.js';

const portfolioItemSchema = new mongoose.Schema(
  {
    title: sanitizedString(120, { default: '' }),
    assetKey: sanitizedString(120, { default: '' }),
    caption: sanitizedString(240, { default: '' }),
    telegramFileId: sanitizedString(255, { default: '' }),
    telegramFileUniqueId: sanitizedString(255, { default: '' }),
    telegramFileType: {
      type: String,
      enum: ['photo', 'document'],
      default: 'photo',
    },
    mimeType: sanitizedString(120, { default: '' }),
    fileName: sanitizedString(180, { default: '' }),
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const onboardingAssetSchema = new mongoose.Schema(
  {
    telegramFileId: sanitizedString(255, { default: '' }),
    telegramFileUniqueId: sanitizedString(255, { default: '' }),
    telegramFileType: {
      type: String,
      enum: ['photo', 'document'],
      default: 'photo',
    },
    mimeType: sanitizedString(120, { default: '' }),
    fileName: sanitizedString(180, { default: '' }),
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const tailorKycSchema = new mongoose.Schema(
  {
    idDocument: {
      type: onboardingAssetSchema,
      default: () => ({}),
    },
    workplaceImage: {
      type: onboardingAssetSchema,
      default: () => ({}),
    },
    selfieWithId: {
      type: onboardingAssetSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

const tailorAgreementSchema = new mongoose.Schema(
  {
    requirementsAcknowledgedAt: {
      type: Date,
      default: null,
    },
    termsReviewedAt: {
      type: Date,
      default: null,
    },
    policiesAcceptedAt: {
      type: Date,
      default: null,
    },
    pricingAcceptedAt: {
      type: Date,
      default: null,
    },
    termsPdfUrl: sanitizedString(500, { default: '' }),
  },
  { _id: false },
);

const tailorProfileSchema = new mongoose.Schema(
  {
    // A dedicated profile prevents client-only fields from ever being written onto tailor records.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: sanitizedString(120, { required: true }),
    businessName: sanitizedString(120, { required: true, index: true }),
    publicName: sanitizedString(120, { required: true, index: true }),
    phoneNumber: sanitizedString(30, { default: '', select: false }),
    bio: sanitizedString(500, { default: '' }),
    location: {
      type: locationSchema,
      required: true,
    },
    workAddress: sanitizedString(180, { required: true }),
    styles: sanitizedStringArray(40, 15),
    specialties: sanitizedStringArray(40, 15),
    budgetRange: {
      type: budgetRangeSchema,
      default: () => ({
        min: null,
        max: null,
        currency: 'NGN',
      }),
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending_review', 'active', 'inactive'],
      default: 'pending_review',
      index: true,
    },
    portfolio: {
      type: [portfolioItemSchema],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length <= 20;
        },
        message: 'Portfolio exceeds maximum size of 20',
      },
    },
    kyc: {
      type: tailorKycSchema,
      default: () => ({}),
    },
    onboardingAgreement: {
      type: tailorAgreementSchema,
      default: () => ({}),
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
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

tailorProfileSchema.index({ 'location.city': 1, verificationStatus: 1, isAvailable: 1 });
// MongoDB cannot build a compound multikey index across two array fields.
// Keep search useful with separate single-field multikey indexes instead.
tailorProfileSchema.index({ styles: 1 });
tailorProfileSchema.index({ specialties: 1 });
tailorProfileSchema.index({ 'budgetRange.min': 1, 'budgetRange.max': 1 });
tailorProfileSchema.index({ status: 1, createdAt: -1 });

export const TailorProfile = mongoose.model('TailorProfile', tailorProfileSchema);
