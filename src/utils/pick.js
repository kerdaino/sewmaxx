export const pick = (source, keys) =>
  keys.reduce((accumulator, key) => {
    if (Object.hasOwn(source, key) && source[key] !== undefined) {
      accumulator[key] = source[key];
    }

    return accumulator;
  }, {});
