import { describe, expect, it } from 'vitest';
import { affiliateOnboardingSchema } from '../../src/validations/onboarding.validation.js';
import { validatePayload } from '../../src/utils/validators.js';
import {
  validateRequestBudget,
  validateRequestDueDate,
  validateRequestLocation,
} from '../../src/bot/validators/request-post.validator.js';

describe('validation logic', () => {
  it('sanitizes and validates affiliate onboarding payloads', () => {
    const payload = validatePayload(affiliateOnboardingSchema, {
      telegramUserId: '12345',
      telegramUsername: 'brand_user',
      fullName: '  Jane \u0000 Doe  ',
      displayName: '  Jane Brand ',
    });

    expect(payload.fullName).toBe('Jane Doe');
    expect(payload.displayName).toBe('Jane Brand');
  });

  it('rejects invalid request budget ranges', () => {
    const result = validateRequestBudget('50000-10000');

    expect(result.isValid).toBe(false);
    expect(result.message).toContain('minimum cannot exceed');
  });

  it('rejects impossible past due dates', () => {
    const result = validateRequestDueDate('2000-01-01');

    expect(result.isValid).toBe(false);
    expect(result.message).toContain('future');
  });

  it('accepts valid request location strings', () => {
    const result = validateRequestLocation('Lekki Phase 1, Lagos');

    expect(result.isValid).toBe(true);
    expect(result.value).toBe('Lekki Phase 1, Lagos');
  });
});
