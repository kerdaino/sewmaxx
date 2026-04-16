import mongoose from 'mongoose';
import { baseSchemaOptions, internalAuditSchema, sanitizedString } from './schema-helpers.js';

const userSchema = new mongoose.Schema(
  {
    // Telegram identity is stored separately from profile data so one account can safely own one role-specific profile.
    telegramUserId: sanitizedString(40, {
      required: true,
      unique: true,
      immutable: true,
      index: true,
    }),
    telegramUsername: sanitizedString(64, {
      default: '',
    }),
    firstName: sanitizedString(80, { default: '' }),
    lastName: sanitizedString(80, { default: '' }),
    languageCode: sanitizedString(12, { default: '' }),
    roles: {
      type: [
        {
          type: String,
          enum: ['affiliate', 'tailor', 'client'],
        },
      ],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && new Set(value).size === value.length;
        },
        message: 'Roles must be unique',
      },
    },
    primaryRole: {
      type: String,
      enum: ['affiliate', 'tailor', 'client'],
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active',
      index: true,
    },
    onboarding: {
      affiliateCompletedAt: {
        type: Date,
        default: null,
      },
      clientCompletedAt: {
        type: Date,
        default: null,
      },
      tailorCompletedAt: {
        type: Date,
        default: null,
      },
    },
    internalAudit: {
      type: internalAuditSchema,
      default: () => ({}),
    },
  },
  baseSchemaOptions,
);

userSchema.index({ primaryRole: 1, status: 1 });
userSchema.index(
  { telegramUsername: 1 },
  {
    sparse: true,
    collation: { locale: 'en', strength: 2 },
  },
);

export const User = mongoose.model('User', userSchema);
