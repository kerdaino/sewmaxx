import Joi from 'joi';
import { sanitizeText } from '../../utils/sanitize.js';
import { parseBudgetRangeInput } from '../utils/parse-budget-range.js';
import { normalizePhoneContact } from '../../utils/phone-contact.js';

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

export const validateTailorPhoneNumber = (value) => {
  const result = normalizePhoneContact(value);

  if (!result.isValid) {
    return {
      isValid: false,
      message: 'Please enter a valid phone number or WhatsApp wa.me link.',
    };
  }

  return result;
};

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
  const result = parseBudgetRangeInput(value, { allowSkip: false });

  if (!result.isValid && result.reason === 'format') {
    return {
      isValid: false,
      message: 'Enter your price range in your local currency, e.g. 10000-50000.',
    };
  }

  if (!result.isValid && result.reason === 'too_large') {
    return {
      isValid: false,
      message: 'That price range looks too large. Enter a realistic local-currency range like 10000-50000.',
    };
  }

  if (!result.isValid) {
    return {
      isValid: false,
      message: 'Enter a valid price range where the first amount is not more than the second.',
    };
  }

  return result;
};
