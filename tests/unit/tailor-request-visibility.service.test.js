import { describe, expect, it } from 'vitest';

import {
  buildTailorRequestSummary,
  calculateTailorRequestMatchScore,
} from '../../src/bot/services/tailor-request-visibility.service.js';

describe('tailor request visibility service', () => {
  it('scores same-city specialty matches highly enough for listing', () => {
    const score = calculateTailorRequestMatchScore({
      request: {
        outfitType: 'dress',
        style: 'bridal dress',
        location: { city: 'Lagos' },
        budgetRange: { min: 40000, max: 120000, currency: 'NGN' },
      },
      tailor: {
        location: { city: 'Lagos' },
        specialties: ['bridal', 'wedding dress'],
        styles: ['ready to wear'],
        budgetRange: { min: 30000, max: 150000, currency: 'NGN' },
      },
    });

    expect(score).toBe(10);
  });

  it('renders a compact request summary safely', () => {
    const summary = buildTailorRequestSummary(
      {
        _id: 'request-1',
        outfitType: 'other',
        style: 'aso ebi gown',
        location: {
          city: 'Lagos',
          area: 'Lekki',
          country: 'Nigeria',
        },
        budgetRange: {
          min: 30000,
          max: 90000,
          currency: 'NGN',
        },
        dueDate: '2099-02-01T00:00:00.000Z',
        status: 'published',
      },
      1,
    );

    expect(summary).toContain('1. aso ebi gown');
    expect(summary).toContain('Request ID: request-1');
    expect(summary).toContain('Location: Lagos, Lekki');
    expect(summary).toContain('Due date: 2099-02-01');
  });
});
