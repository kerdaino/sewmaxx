import Joi from 'joi';

const telegramUserSchema = {
  telegramUserId: Joi.string().trim().max(40).required(),
  telegramUsername: Joi.string().trim().allow('').max(64).optional(),
};

const requiredBudgetSchema = Joi.number().min(0).required();
const phoneNumberSchema = Joi.string()
  .trim()
  .pattern(/^\+?[0-9 ()-]{7,30}$/);
const uploadedAssetSchema = Joi.object({
  telegramFileId: Joi.string().trim().max(255).required(),
  telegramFileUniqueId: Joi.string().trim().allow('').max(255).default(''),
  telegramFileType: Joi.string().trim().valid('photo', 'document').default('photo'),
  mimeType: Joi.string().trim().allow('').max(120).default(''),
  fileName: Joi.string().trim().allow('').max(180).default(''),
});
const portfolioAssetSchema = uploadedAssetSchema.keys({
  title: Joi.string().trim().allow('').max(120).default(''),
  assetKey: Joi.string().trim().allow('').max(255).default(''),
  caption: Joi.string().trim().allow('').max(240).default(''),
});

export const affiliateOnboardingSchema = Joi.object({
  ...telegramUserSchema,
  fullName: Joi.string().trim().min(2).max(120).required(),
  displayName: Joi.string().trim().allow('').max(120).default(''),
  phoneNumber: phoneNumberSchema.required(),
  country: Joi.string().trim().min(2).max(80).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().allow('').max(80).default(''),
  area: Joi.string().trim().allow('').max(120).default(''),
  kycDetails: Joi.object({
    idDocument: uploadedAssetSchema.required(),
    selfieWithId: uploadedAssetSchema.required(),
  }).required(),
});

export const clientOnboardingSchema = Joi.object({
  ...telegramUserSchema,
  fullName: Joi.string().trim().min(2).max(120).required(),
  phoneNumber: phoneNumberSchema.required(),
  country: Joi.string().trim().min(2).max(80).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().allow('').max(80).default(''),
  area: Joi.string().trim().allow('').max(120).default(''),
  stylePreferences: Joi.array().items(Joi.string().trim().min(2).max(50)).max(10).default([]),
  referralCode: Joi.string().trim().uppercase().max(40).optional(),
});

export const tailorOnboardingSchema = Joi.object({
  ...telegramUserSchema,
  fullName: Joi.string().trim().min(2).max(120).required(),
  businessName: Joi.string().trim().min(2).max(120).required(),
  publicName: Joi.string().trim().allow('').max(120).default(''),
  phoneNumber: phoneNumberSchema.required(),
  country: Joi.string().trim().min(2).max(80).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().allow('').max(80).default(''),
  area: Joi.string().trim().allow('').max(120).default(''),
  workAddress: Joi.string().trim().min(2).max(180).required(),
  specialties: Joi.array().items(Joi.string().trim().min(2).max(50)).min(1).max(10).required(),
  budgetMin: requiredBudgetSchema,
  budgetMax: requiredBudgetSchema,
  currency: Joi.string().trim().uppercase().valid('NGN', 'USD').default('NGN'),
  portfolio: Joi.array()
    .items(portfolioAssetSchema)
    .min(1)
    .max(20)
    .required(),
  kyc: Joi.object({
    idDocument: uploadedAssetSchema.required(),
    workplaceImage: uploadedAssetSchema.required(),
    selfieWithId: uploadedAssetSchema.required(),
  }).required(),
  onboardingAgreement: Joi.object({
    requirementsAcknowledgedAt: Joi.date().iso().required(),
    termsReviewedAt: Joi.date().iso().required(),
    policiesAcceptedAt: Joi.date().iso().required(),
    pricingAcceptedAt: Joi.date().iso().required(),
    termsPdfUrl: Joi.string().trim().allow('').max(500).default(''),
  }).required(),
  referralCode: Joi.string().trim().uppercase().max(40).optional(),
}).custom((value, helpers) => {
  if (value.budgetMin > value.budgetMax) {
    return helpers.error('any.invalid');
  }

  return value;
}, 'budget range validation');
