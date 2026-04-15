import Joi from 'joi';

export const adminListQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
});
