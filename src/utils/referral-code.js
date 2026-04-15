import crypto from 'node:crypto';

export const generateReferralCode = (prefix) =>
  `${prefix}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();
