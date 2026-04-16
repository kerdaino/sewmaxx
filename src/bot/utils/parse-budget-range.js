import { sanitizeText } from '../../utils/sanitize.js';

const MAX_BUDGET_VALUE = 1_000_000_000;

export const parseBudgetRangeInput = (value, { allowSkip = false } = {}) => {
  const candidate = sanitizeText(value, 40).toLowerCase();

  if (allowSkip && (!candidate || candidate === 'skip')) {
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
      reason: 'format',
    };
  }

  const min = Number(match[1]);
  const max = Number(match[2]);

  if (
    Number.isNaN(min) ||
    Number.isNaN(max) ||
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min < 0 ||
    max < 0
  ) {
    return {
      isValid: false,
      reason: 'invalid_number',
    };
  }

  if (min > max) {
    return {
      isValid: false,
      reason: 'min_exceeds_max',
    };
  }

  if (max > MAX_BUDGET_VALUE) {
    return {
      isValid: false,
      reason: 'too_large',
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
