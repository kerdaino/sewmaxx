import Joi from 'joi';
import { sanitizeText } from '../../utils/sanitize.js';
import { normalizePhoneContact } from '../../utils/phone-contact.js';

const fullNameSchema = Joi.string().trim().min(2).max(120).required();
const displayNameSchema = Joi.string().trim().min(2).max(120).required();
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
  const result = normalizePhoneContact(value);

  if (!result.isValid) {
    return {
      isValid: false,
      message: 'Please enter a valid phone number or WhatsApp wa.me link.',
    };
  }

  return result;
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
