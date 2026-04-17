import { describe, expect, it } from 'vitest';
import {
  affiliateOnboardingSchema,
  clientOnboardingSchema,
  tailorOnboardingSchema,
} from '../../src/validations/onboarding.validation.js';
import { searchTailorsSchema } from '../../src/validations/search.validation.js';
import { validatePayload } from '../../src/utils/validators.js';
import {
  validateRequestBudget,
  validateRequestDueDate,
  validateRequestLocation,
} from '../../src/bot/validators/request-post.validator.js';
import { validateSearchBudget } from '../../src/bot/validators/search.validator.js';
import {
  validateTailorBudgetRange,
  validateTailorPhoneNumber,
} from '../../src/bot/validators/tailor-onboarding.validator.js';
import { validateClientPhoneNumber as validateBotClientPhoneNumber } from '../../src/bot/validators/client-onboarding.validator.js';

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

  it('accepts client onboarding API payloads with required location fields', () => {
    const payload = validatePayload(clientOnboardingSchema, {
      telegramUserId: '12345',
      telegramUsername: 'client_user',
      fullName: 'Ada Client',
      phoneNumber: '08012345678',
      country: 'Nigeria',
      city: 'Lagos',
      area: 'Lekki',
      referralCode: 'aff-1234',
    });

    expect(payload.country).toBe('Nigeria');
    expect(payload.city).toBe('Lagos');
    expect(payload.area).toBe('Lekki');
    expect(payload.referralCode).toBe('AFF-1234');
  });

  it('accepts tailor onboarding API payloads with required profile fields', () => {
    const payload = validatePayload(tailorOnboardingSchema, {
      telegramUserId: '12345',
      telegramUsername: 'tailor_user',
      fullName: 'Ada Tailor',
      businessName: 'Ada Stitches',
      publicName: 'Ada Bridal',
      phoneNumber: '08012345678',
      country: 'Nigeria',
      city: 'Lagos',
      workAddress: '12 Marina',
      specialties: ['bridal', 'dress'],
      budgetMin: 10000,
      budgetMax: 50000,
    });

    expect(payload.fullName).toBe('Ada Tailor');
    expect(payload.publicName).toBe('Ada Bridal');
    expect(payload.workAddress).toBe('12 Marina');
    expect(payload.budgetMin).toBe(10000);
    expect(payload.budgetMax).toBe(50000);
  });

  it('accepts valid tailor budget ranges and skip', () => {
    const ranged = validateTailorBudgetRange('10000-50000');
    const skipped = validateTailorBudgetRange('skip');

    expect(ranged.isValid).toBe(true);
    expect(ranged.value).toEqual({ min: 10000, max: 50000, currency: 'NGN' });
    expect(skipped.isValid).toBe(true);
    expect(skipped.value).toEqual({ min: null, max: null, currency: 'NGN' });
  });

  it('accepts practical client and tailor phone numbers', () => {
    const clientResult = validateBotClientPhoneNumber('+234 801 234 5678');
    const tailorResult = validateTailorPhoneNumber('0801-234-5678');

    expect(clientResult.isValid).toBe(true);
    expect(tailorResult.isValid).toBe(true);
  });

  it('accepts valid search budget ranges', () => {
    const result = validateSearchBudget('10000 - 50000');

    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({ min: 10000, max: 50000, currency: 'NGN' });
  });

  it('accepts search API payloads with optional budgetRange', () => {
    const payload = validatePayload(searchTailorsSchema, {
      city: 'Lagos',
      specialty: 'bridal',
      budgetRange: {
        min: 20000,
        max: 70000,
        currency: 'NGN',
      },
    });

    expect(payload.budgetRange).toEqual({
      min: 20000,
      max: 70000,
      currency: 'NGN',
    });
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
