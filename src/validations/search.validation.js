import Joi from 'joi';

export const searchTailorsSchema = Joi.object({
  city: Joi.string().trim().min(2).max(80).required(),
  specialty: Joi.string().trim().min(2).max(50).required(),
  limit: Joi.number().integer().min(1).max(20).default(10),
});
