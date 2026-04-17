import { beforeEach, describe, expect, it, vi } from 'vitest';

const tailorProfileFind = vi.fn();

vi.mock('../../src/models/tailor-profile.model.js', () => ({
  TailorProfile: {
    find: tailorProfileFind,
  },
}));

describe('search scoring logic', () => {
  beforeEach(() => {
    tailorProfileFind.mockReset();
  });

  it('scores exact city, matching style, and overlapping budget highest', async () => {
    const { calculateTailorMatchScore } = await import('../../src/services/search.service.js');

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

  it('penalizes incompatible budgets', async () => {
    const { getBudgetCompatibilityScore } = await import('../../src/services/search.service.js');

    const score = getBudgetCompatibilityScore(
      { min: 100000, max: 150000 },
      { min: 10000, max: 20000 },
    );

    expect(score).toBe(-1);
  });

  it('does not expose tailor work addresses in public search results', async () => {
    const { searchTailors } = await import('../../src/services/search.service.js');

    tailorProfileFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'tailor-1',
            businessName: 'Ada Stitches',
            publicName: 'Ada',
            location: { city: 'Lagos' },
            workAddress: '12 Marina',
            specialties: ['bridal'],
            styles: ['wedding'],
            budgetRange: { min: 30000, max: 90000, currency: 'NGN' },
            verificationStatus: 'approved',
            status: 'active',
          },
        ]),
      }),
    });

    const results = await searchTailors({
      city: 'Lagos',
      specialty: 'bridal',
      limit: 10,
      budgetRange: { min: 40000, max: 80000, currency: 'NGN' },
    });

    expect(results).toHaveLength(1);
    expect(results[0]).not.toHaveProperty('workAddress');
  });
});
