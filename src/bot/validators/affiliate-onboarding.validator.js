import Joi from 'joi';
import { sanitizeText } from '../../utils/sanitize.js';

const fullNameSchema = Joi.string().trim().min(2).max(120).required();
const displayNameSchema = Joi.string().trim().min(2).max(120).required();

export const validateAffiliateFullName = (value) => {
  const candidate = sanitizeText(value, 120);
  const { error, value: validated } = fullNameSchema.validate(candidate);

  if (error) {
    return {
      isValid: false,
      message: 'Please enter a valid full name using 2 to 120 characters.',
    };
  }

  return {
    isValid: true,
    value: validated,
  };
};

export const validateAffiliateDisplayName = (value) => {
  const candidate = sanitizeText(value, 120);
  const { error, value: validated } = displayNameSchema.validate(candidate);

  if (error) {
    return {
      isValid: false,
      message: 'Please enter a valid display or brand name using 2 to 120 characters.',
    };
  }

  return {
    isValid: true,
    value: validated,
  };
};
