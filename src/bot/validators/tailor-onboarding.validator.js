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

export const validateTailorFullName = (value) =>
  validateField(
    Joi.string().trim().min(2).max(120).required(),
    value,
    'Please enter a valid full name using 2 to 120 characters.',
    120,
  );

export const validateTailorBusinessName = (value) =>
  validateField(
    Joi.string().trim().min(2).max(120).required(),
    value,
    'Please enter a valid business name using 2 to 120 characters.',
    120,
  );

export const validateTailorPublicName = (value) =>
  validateField(
    Joi.string().trim().min(2).max(120).required(),
    value,
    'Please enter a valid public name using 2 to 120 characters.',
    120,
  );

export const validateTailorCountry = (value) =>
  validateField(
    Joi.string().trim().min(2).max(80).required(),
    value,
    'Please enter a valid country using 2 to 80 characters.',
    80,
  );

export const validateTailorCity = (value) =>
  validateField(
    Joi.string().trim().min(2).max(80).required(),
    value,
    'Please enter a valid city using 2 to 80 characters.',
    80,
  );

export const validateTailorWorkAddress = (value) =>
  validateField(
    Joi.string().trim().min(4).max(180).required(),
    value,
    'Please enter a valid work address using 4 to 180 characters.',
    180,
  );

export const validateTailorSpecialties = (value) => {
  const candidate = sanitizeText(value, 240);
  const items = candidate
    .split(',')
    .map((entry) => sanitizeText(entry, 40))
    .filter(Boolean);

  if (items.length === 0 || items.length > 15) {
    return {
      isValid: false,
      message: 'Please enter 1 to 15 specialties separated by commas.',
    };
  }

  const uniqueItems = [...new Set(items)];

  return {
    isValid: true,
    value: uniqueItems,
  };
};

export const validateTailorBudgetRange = (value) => {
  const candidate = sanitizeText(value, 40).toLowerCase();

  if (!candidate || candidate === 'skip') {
    return {
      isValid: true,
      value: {
        min: null,
        max: null,
        currency: 'NGN',
      },
    };
  }

  const match = candidate.match(/^(\d+)\s*-\s*(\d+)$/);

  if (!match) {
    return {
      isValid: false,
      message: 'Enter a budget range like 10000-50000, or send skip.',
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
