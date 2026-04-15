import mongoose from 'mongoose';
import {
  baseSchemaOptions,
  budgetRangeSchema,
  internalAuditSchema,
  locationSchema,
  sanitizedString,
} from './schema-helpers.js';

const searchSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientProfile',
      default: null,
      index: true,
    },
    style: sanitizedString(40, { required: true, index: true }),
    location: {
      type: locationSchema,
      required: true,
    },
    budgetRange: {
      type: budgetRangeSchema,
      default: () => ({
        min: null,
        max: null,
        currency: 'NGN',
      }),
    },
    matchedTailorIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TailorProfile',
        },
      ],
      default: [],
    },
    matchedTailorCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
      index: true,
    },
    lastInteractionAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    internalAudit: {
      type: internalAuditSchema,
      default: () => ({}),
    },
  },
  baseSchemaOptions,
);

searchSessionSchema.index({ userId: 1, status: 1, updatedAt: -1 });
searchSessionSchema.index({ 'location.city': 1, style: 1 });

export const SearchSession = mongoose.model('SearchSession', searchSessionSchema);
