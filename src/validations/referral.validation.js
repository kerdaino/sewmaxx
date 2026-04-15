import Joi from 'joi';
import { USER_TYPES } from '../constants/app.constants.js';

export const referralTrackingSchema = Joi.object({
  referralCode: Joi.string().trim().max(40).required(),
  referredTelegramUserId: Joi.string().trim().max(40).required(),
  referredUserType: Joi.string()
    .valid(USER_TYPES.CLIENT, USER_TYPES.TAILOR)
    .required(),
  source: Joi.string().valid('telegram_start', 'api').default('api'),
});
