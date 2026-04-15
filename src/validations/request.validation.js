import Joi from 'joi';

export const createServiceRequestSchema = Joi.object({
  clientTelegramUserId: Joi.string().trim().max(40).required(),
  category: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().min(10).max(1000).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  budgetMin: Joi.number().min(0).optional(),
  budgetMax: Joi.number().min(0).optional(),
  preferredTimeline: Joi.string().trim().max(120).allow('').optional(),
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
