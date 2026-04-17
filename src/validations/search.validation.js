import Joi from 'joi';

export const searchTailorsSchema = Joi.object({
  city: Joi.string().trim().min(2).max(80).required(),
  specialty: Joi.string().trim().min(2).max(50).required(),
  limit: Joi.number().integer().min(1).max(20).default(10),
  budgetRange: Joi.object({
    min: Joi.number().min(0).allow(null).default(null),
    max: Joi.number().min(0).allow(null).default(null),
    currency: Joi.string().trim().uppercase().valid('NGN', 'USD').default('NGN'),
  })
    .optional()
    .default({
      min: null,
      max: null,
      currency: 'NGN',
    }),
}).custom((value, helpers) => {
  if (
    typeof value.budgetRange?.min === 'number' &&
    typeof value.budgetRange?.max === 'number' &&
    value.budgetRange.min > value.budgetRange.max
  ) {
    return helpers.error('any.invalid');
  }

  return value;
});
