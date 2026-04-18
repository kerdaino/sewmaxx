import Joi from 'joi';
import { sanitizeText } from '../../utils/sanitize.js';

const fullNameSchema = Joi.string().trim().min(2).max(120).required();
const displayNameSchema = Joi.string().trim().min(2).max(120).required();
const phoneNumberSchema = Joi.string()
  .trim()
  .pattern(/^\+?[0-9 ()-]{7,30}$/)
  .required();
const locationSchema = Joi.string().trim().min(2).max(80).required();

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

export const validateAffiliatePhoneNumber = (value) => {
  const candidate = sanitizeText(value, 30);
  const { error, value: validated } = phoneNumberSchema.validate(candidate);

  if (error) {
    return {
      isValid: false,
      message: 'Please enter a valid phone number using 7 to 30 characters.',
    };
  }

  return {
    isValid: true,
    value: validated,
  };
};

export const validateAffiliateCountry = (value) => {
  const candidate = sanitizeText(value, 80);
  const { error, value: validated } = locationSchema.validate(candidate);

  if (error) {
    return {
      isValid: false,
      message: 'Please enter a valid country using 2 to 80 characters.',
    };
  }

  return {
    isValid: true,
    value: validated,
  };
};

export const validateAffiliateCity = (value) => {
  const candidate = sanitizeText(value, 80);
  const { error, value: validated } = locationSchema.validate(candidate);

  if (error) {
    return {
      isValid: false,
      message: 'Please enter a valid city using 2 to 80 characters.',
    };
  }

  return {
    isValid: true,
    value: validated,
  };
};
