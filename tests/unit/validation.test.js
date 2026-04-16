import { describe, expect, it } from 'vitest';
import { affiliateOnboardingSchema } from '../../src/validations/onboarding.validation.js';
import { validatePayload } from '../../src/utils/validators.js';
import {
  validateRequestBudget,
  validateRequestDueDate,
  validateRequestLocation,
} from '../../src/bot/validators/request-post.validator.js';
import { validateSearchBudget } from '../../src/bot/validators/search.validator.js';
import { validateTailorBudgetRange } from '../../src/bot/validators/tailor-onboarding.validator.js';

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

  it('accepts valid tailor budget ranges and skip', () => {
    const ranged = validateTailorBudgetRange('10000-50000');
    const skipped = validateTailorBudgetRange('skip');

    expect(ranged.isValid).toBe(true);
    expect(ranged.value).toEqual({ min: 10000, max: 50000, currency: 'NGN' });
    expect(skipped.isValid).toBe(true);
    expect(skipped.value).toEqual({ min: null, max: null, currency: 'NGN' });
  });

  it('accepts valid search budget ranges', () => {
    const result = validateSearchBudget('10000 - 50000');

    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({ min: 10000, max: 50000, currency: 'NGN' });
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
