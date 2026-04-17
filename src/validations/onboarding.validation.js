import Joi from 'joi';

const telegramUserSchema = {
  telegramUserId: Joi.string().trim().max(40).required(),
  telegramUsername: Joi.string().trim().allow('').max(64).optional(),
};

const optionalBudgetSchema = Joi.number().min(0).allow(null);

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
  country: Joi.string().trim().min(2).max(80).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().allow('').max(80).default(''),
  area: Joi.string().trim().allow('').max(120).default(''),
  stylePreferences: Joi.array().items(Joi.string().trim().min(2).max(50)).max(10).default([]),
  referralCode: Joi.string().trim().max(40).optional(),
});

export const tailorOnboardingSchema = Joi.object({
  ...telegramUserSchema,
  fullName: Joi.string().trim().min(2).max(120).required(),
  businessName: Joi.string().trim().min(2).max(120).required(),
  publicName: Joi.string().trim().allow('').max(120).default(''),
  phoneNumber: Joi.string().trim().min(7).max(30).required(),
  country: Joi.string().trim().min(2).max(80).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().allow('').max(80).default(''),
  area: Joi.string().trim().allow('').max(120).default(''),
  workAddress: Joi.string().trim().min(2).max(180).required(),
  specialties: Joi.array().items(Joi.string().trim().min(2).max(50)).min(1).max(10).required(),
  budgetMin: optionalBudgetSchema.optional(),
  budgetMax: optionalBudgetSchema.optional(),
  currency: Joi.string().trim().uppercase().valid('NGN', 'USD').default('NGN'),
  referralCode: Joi.string().trim().max(40).optional(),
}).custom((value, helpers) => {
  if (
    typeof value.budgetMin === 'number' &&
    typeof value.budgetMax === 'number' &&
    value.budgetMin > value.budgetMax
  ) {
    return helpers.error('any.invalid');
  }

  return value;
}, 'budget range validation');
