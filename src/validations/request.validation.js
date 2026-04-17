import Joi from 'joi';

export const createServiceRequestSchema = Joi.object({
  clientTelegramUserId: Joi.string().trim().max(40).required(),
  outfitType: Joi.string()
    .trim()
    .valid('agbada', 'dress', 'senator', 'shirt', 'trouser', 'wedding', 'uniform', 'other')
    .required(),
  style: Joi.string().trim().max(80).allow('').default(''),
  notes: Joi.string().trim().max(600).allow('').default(''),
  country: Joi.string().trim().min(2).max(80).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  area: Joi.string().trim().max(120).allow('').default(''),
  budgetMin: Joi.number().min(0).optional(),
  budgetMax: Joi.number().min(0).optional(),
  currency: Joi.string().trim().uppercase().valid('NGN', 'USD').default('NGN'),
  dueDate: Joi.date().iso().required(),
}).custom((value, helpers) => {
  if (
    typeof value.budgetMin === 'number' &&
    typeof value.budgetMax === 'number' &&
    value.budgetMin > value.budgetMax
  ) {
    return helpers.error('any.invalid');
  }

  if (value.outfitType === 'other' && !String(value.style ?? '').trim()) {
    return helpers.error('any.invalid');
  }

  return value;
}, 'budget range validation');
