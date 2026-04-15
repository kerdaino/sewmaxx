const CONTROL_CHARACTERS_REGEX = /[\u0000-\u001F\u007F]/g;

export const sanitizeText = (value, maxLength = 300) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(CONTROL_CHARACTERS_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};

export const sanitizeObjectStrings = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObjectStrings(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, entryValue]) => {
      accumulator[key] = sanitizeObjectStrings(entryValue);
      return accumulator;
    }, {});
  }

  return sanitizeText(value);
};
