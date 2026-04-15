import Joi from 'joi';

const telegramUserSchema = {
  telegramUserId: Joi.string().trim().max(40).required(),
  telegramUsername: Joi.string().trim().allow('').max(64).optional(),
};

export const affiliateOnboardingSchema = Joi.object({
  ...telegramUserSchema,
  fullName: Joi.string().trim().min(2).max(120).required(),
  displayName: Joi.string().trim().allow('').max(120).default(''),
  phoneNumber: Joi.string().trim().allow('').max(30).default(''),
});

export const clientOnboardingSchema = Joi.object({
  ...telegramUserSchema,
  fullName: Joi.string().trim().min(2).max(120).required(),
  phoneNumber: Joi.string().trim().min(7).max(30).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  stylePreferences: Joi.array().items(Joi.string().trim().min(2).max(50)).max(10).default([]),
  referralCode: Joi.string().trim().max(40).optional(),
});

export const tailorOnboardingSchema = Joi.object({
  ...telegramUserSchema,
  businessName: Joi.string().trim().min(2).max(120).required(),
  phoneNumber: Joi.string().trim().min(7).max(30).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  specialties: Joi.array().items(Joi.string().trim().min(2).max(50)).min(1).max(10).required(),
  referralCode: Joi.string().trim().max(40).optional(),
});
