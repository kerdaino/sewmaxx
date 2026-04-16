import mongoose from 'mongoose';
import { sanitizeText } from '../utils/sanitize.js';

const trimmedString = (maxLength, extra = {}) => ({
  type: String,
  trim: true,
  maxlength: maxLength,
  set: (value) => sanitizeText(value, maxLength),
  ...extra,
});

export const sanitizedString = (maxLength, extra = {}) => trimmedString(maxLength, extra);

export const sanitizedStringArray = (maxItemLength, maxItems = 20) => ({
  type: [
    {
      type: String,
      trim: true,
      maxlength: maxItemLength,
      set: (value) => sanitizeText(value, maxItemLength),
    },
  ],
  default: [],
  validate: {
    validator(value) {
      return Array.isArray(value) && value.length <= maxItems;
    },
    message: `Array exceeds maximum size of ${maxItems}`,
  },
});

export const locationSchema = new mongoose.Schema(
  {
    city: sanitizedString(80, { required: true }),
    state: sanitizedString(80, { default: '' }),
    country: sanitizedString(80, { required: true, default: 'Nigeria' }),
    area: sanitizedString(120, { default: '' }),
  },
  { _id: false },
);

export const budgetRangeSchema = new mongoose.Schema(
  {
    min: {
      type: Number,
      min: 0,
      default: null,
    },
    max: {
      type: Number,
      min: 0,
      default: null,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      enum: ['NGN', 'USD'],
      default: 'NGN',
    },
  },
  { _id: false },
);

budgetRangeSchema.path('max').validate(function validateMax(value) {
  if (value === null || this.min === null) {
    return true;
  }

  return value >= this.min;
}, 'Budget max must be greater than or equal to budget min');

export const internalAuditSchema = new mongoose.Schema(
  {
    notes: sanitizedString(500, { default: '', select: false }),
    riskFlags: sanitizedStringArray(40, 10),
    lastReviewedAt: {
      type: Date,
      default: null,
      select: false,
    },
    createdBySystem: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { _id: false },
);

export const baseSchemaOptions = Object.freeze({
  timestamps: true,
  strict: 'throw',
  minimize: false,
});
