import Joi from 'joi';
import { sanitizeText } from '../../utils/sanitize.js';
import { parseBudgetRangeInput } from '../utils/parse-budget-range.js';

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
  const result = parseBudgetRangeInput(value);

  if (!result.isValid && result.reason === 'format') {
    return {
      isValid: false,
      message: 'Enter your budget range in your local currency, e.g. 10000-50000.',
    };
  }

  if (!result.isValid && result.reason === 'too_large') {
    return {
      isValid: false,
      message: 'Budget range is too large. Enter a realistic local-currency amount like 10000-50000.',
    };
  }

  if (!result.isValid) {
    return {
      isValid: false,
      message: 'Budget range must be valid and the minimum cannot exceed the maximum.',
    };
  }

  return result;
};
