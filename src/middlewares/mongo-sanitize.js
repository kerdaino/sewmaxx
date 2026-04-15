const ILLEGAL_KEY_PATTERN = /^\$|\.|\uFF0E|\uFF04/;

const sanitizeMongoValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeMongoValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, entryValue]) => {
      if (!ILLEGAL_KEY_PATTERN.test(key)) {
        accumulator[key] = sanitizeMongoValue(entryValue);
      }

      return accumulator;
    }, {});
  }

  return value;
};

export const mongoSanitizeMiddleware = (req, res, next) => {
  // Strip operator-like keys before they ever reach application logic.
  req.body = sanitizeMongoValue(req.body);
  req.query = sanitizeMongoValue(req.query);
  req.params = sanitizeMongoValue(req.params);
  next();
};
