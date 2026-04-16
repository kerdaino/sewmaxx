import mongoose from 'mongoose';
import {
  baseSchemaOptions,
  budgetRangeSchema,
  internalAuditSchema,
  locationSchema,
  sanitizedString,
} from './schema-helpers.js';

const requestPostSchema = new mongoose.Schema(
  {
    clientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientProfile',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    outfitType: {
      type: String,
      enum: ['agbada', 'dress', 'senator', 'shirt', 'trouser', 'wedding', 'uniform', 'other'],
      required: true,
      index: true,
    },
    style: sanitizedString(40, { default: '' }),
    notes: sanitizedString(600, { default: '' }),
    budgetRange: {
      type: budgetRangeSchema,
      default: () => ({
        min: null,
        max: null,
        currency: 'NGN',
      }),
    },
    location: {
      type: locationSchema,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
      validate: {
        validator(value) {
          return value instanceof Date && !Number.isNaN(value.getTime());
        },
        message: 'Due date must be a valid date',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'matching', 'assigned', 'closed', 'cancelled'],
      default: 'published',
      index: true,
    },
    coordinatorStatus: {
      type: String,
      enum: ['unreviewed', 'reviewing', 'contacted', 'resolved'],
      default: 'unreviewed',
      index: true,
    },
    assignedCoordinatorId: {
      type: String,
      trim: true,
      default: '',
      select: false,
    },
    dedupeKey: {
      type: String,
      trim: true,
      default: '',
      select: false,
    },
    lastCoordinatorActionAt: {
      type: Date,
      default: null,
      select: false,
    },
    internalAudit: {
      type: internalAuditSchema,
      default: () => ({}),
    },
  },
  baseSchemaOptions,
);

requestPostSchema.index({ status: 1, 'location.city': 1, dueDate: 1 });
requestPostSchema.index({ clientProfileId: 1, createdAt: -1 });
requestPostSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      dedupeKey: { $type: 'string', $ne: '' },
      status: { $in: ['draft', 'published', 'matching', 'assigned'] },
    },
  },
);

export const RequestPost = mongoose.model('RequestPost', requestPostSchema);
