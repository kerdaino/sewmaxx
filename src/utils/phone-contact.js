import { sanitizeText } from './sanitize.js';

const PHONE_INPUT_MAX_LENGTH = 120;
const WA_ME_PATTERN = /^(?:https:\/\/)?wa\.me\/([0-9]{7,29})(?:[/?#].*)?$/i;
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,40}$/;
const MAX_STORED_PHONE_LENGTH = 30;

const getDigits = (value) => value.replace(/\D/g, '');

export const normalizePhoneContact = (value) => {
  const candidate = sanitizeText(value, PHONE_INPUT_MAX_LENGTH).trim();

  if (!candidate) {
    return {
      isValid: false,
    };
  }

  const waMatch = candidate.match(WA_ME_PATTERN);

  if (waMatch) {
    return {
      isValid: true,
      value: `+${waMatch[1]}`,
    };
  }

  if (!PHONE_PATTERN.test(candidate)) {
    return {
      isValid: false,
    };
  }

  const digits = getDigits(candidate);

  const normalizedLength = digits.length + (candidate.startsWith('+') ? 1 : 0);

  if (digits.length < 7 || normalizedLength > MAX_STORED_PHONE_LENGTH) {
    return {
      isValid: false,
    };
  }

  return {
    isValid: true,
    value: `${candidate.startsWith('+') ? '+' : ''}${digits}`,
  };
};

export const buildWhatsAppLink = (value) => {
  const normalized = normalizePhoneContact(value);

  if (!normalized.isValid) {
    return '';
  }

  const digits = getDigits(normalized.value);

  if (!normalized.value.startsWith('+') && digits.startsWith('0')) {
    return '';
  }

  return `https://wa.me/${digits}`;
};
