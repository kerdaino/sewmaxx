import { describe, expect, it } from 'vitest';
import { generateReferralCode } from '../../src/utils/referral-code.js';

describe('generateReferralCode', () => {
  it('creates uppercase affiliate codes with a stable prefix', () => {
    const code = generateReferralCode('AFF');

    expect(code.startsWith('AFF-')).toBe(true);
    expect(code).toBe(code.toUpperCase());
  });

  it('creates unique values across repeated calls', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateReferralCode('AFF')));

    expect(codes.size).toBe(200);
  });
});
