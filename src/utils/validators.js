import { ApiError } from './api-error.js';
import { sanitizeObjectStrings } from './sanitize.js';

export const validatePayload = (schema, payload) => {
  const { value, error } = schema.validate(sanitizeObjectStrings(payload), {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new ApiError(400, 'Invalid request payload', error.details);
  }

  return value;
};
