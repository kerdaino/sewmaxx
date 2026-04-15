import Joi from 'joi';
import { sanitizeText } from '../../utils/sanitize.js';

const validateField = (schema, value, message, maxLength) => {
  const candidate = sanitizeText(value, maxLength);
  const { error, value: validated } = schema.validate(candidate);

  if (error) {
    return {
      isValid: false,
      message,
    };
  }

  return {
    isValid: true,
    value: validated,
  };
};

export const validateSearchStyle = (value) =>
  validateField(
    Joi.string().trim().min(2).max(40).required(),
    value,
    'Please enter a valid outfit type or style need using 2 to 40 characters.',
    40,
  );

export const validateSearchLocation = (value) =>
  validateField(
    Joi.string().trim().min(2).max(80).required(),
    value,
    'Please enter a valid city or location using 2 to 80 characters.',
    80,
  );

export const validateSearchBudget = (value) => {
  const candidate = sanitizeText(value, 40).toLowerCase();
  const match = candidate.match(/^(\d+)\s*-\s*(\d+)$/);

  if (!match) {
    return {
      isValid: false,
      message: 'Enter a budget like 10000-50000.',
    };
  }

  const min = Number(match[1]);
  const max = Number(match[2]);

  if (Number.isNaN(min) || Number.isNaN(max) || min > max) {
    return {
      isValid: false,
      message: 'Budget range must be valid and the minimum cannot exceed the maximum.',
    };
  }

  return {
    isValid: true,
    value: {
      min,
      max,
      currency: 'NGN',
    },
  };
};
