import { describe, expect, it } from 'vitest';
import { calculateTailorMatchScore, getBudgetCompatibilityScore } from '../../src/services/search.service.js';

describe('search scoring logic', () => {
  it('scores exact city, matching style, and overlapping budget highest', () => {
    const score = calculateTailorMatchScore({
      city: 'Lagos',
      specialty: 'wedding',
      budgetRange: { min: 40000, max: 80000 },
      tailor: {
        location: { city: 'Lagos' },
        specialties: ['wedding', 'dress'],
        styles: ['bridal'],
        budgetRange: { min: 30000, max: 90000 },
      },
    });

    expect(score).toBe(10);
  });

  it('penalizes incompatible budgets', () => {
    const score = getBudgetCompatibilityScore(
      { min: 100000, max: 150000 },
      { min: 10000, max: 20000 },
    );

    expect(score).toBe(-1);
  });
});
