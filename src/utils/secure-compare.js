import crypto from 'node:crypto';

export const secureCompare = (leftValue, rightValue) => {
  if (typeof leftValue !== 'string' || typeof rightValue !== 'string') {
    return false;
  }

  const left = Buffer.from(leftValue, 'utf8');
  const right = Buffer.from(rightValue, 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
};
