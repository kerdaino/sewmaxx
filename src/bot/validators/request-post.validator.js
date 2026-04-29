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

export const validateRequestOtherStyle = (value) =>
  validateField(
    Joi.string().trim().min(2).max(80).required(),
    value,
    'Please enter a valid outfit description using 2 to 80 characters.',
    80,
  );

export const validateRequestLocation = (value) =>
  validateField(
    Joi.string().trim().min(2).max(120).required(),
    value,
    'Please enter a valid location using 2 to 120 characters.',
    120,
  );

export const validateRequestBudget = (value) => {
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

export const validateRequestDueDate = (value) => {
  const candidate = sanitizeText(value, 20);
  const { error } = Joi.string()
    .trim()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .validate(candidate);

  if (error) {
    return {
      isValid: false,
      message: 'Enter the due date in YYYY-MM-DD format.',
    };
  }

  const date = new Date(`${candidate}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return {
      isValid: false,
      message: 'The due date is invalid.',
    };
  }

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  if (date.getTime() <= todayUtc) {
    return {
      isValid: false,
      message: 'The due date must be in the future.',
    };
  }

  return {
    isValid: true,
    value: date,
    displayValue: candidate,
  };
};
