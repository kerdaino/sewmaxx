import Joi from 'joi';
import { sanitizeText } from '../../utils/sanitize.js';

const fullNameSchema = Joi.string().trim().min(2).max(120).required();
const countrySchema = Joi.string().trim().min(2).max(80).required();
const citySchema = Joi.string().trim().min(2).max(80).required();
const areaSchema = Joi.string().trim().min(2).max(120).required();

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

export const validateClientFullName = (value) =>
  validateField(
    fullNameSchema,
    value,
    'Please enter a valid full name using 2 to 120 characters.',
    120,
  );

export const validateClientCountry = (value) =>
  validateField(
    countrySchema,
    value,
    'Please enter a valid country using 2 to 80 characters.',
    80,
  );

export const validateClientCity = (value) =>
  validateField(
    citySchema,
    value,
    'Please enter a valid city using 2 to 80 characters.',
    80,
  );

export const validateClientArea = (value) =>
  validateField(
    areaSchema,
    value,
    'Please enter a valid area or full location using 2 to 120 characters.',
    120,
  );
