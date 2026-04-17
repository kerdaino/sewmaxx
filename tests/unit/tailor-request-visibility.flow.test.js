import { beforeEach, describe, expect, it, vi } from 'vitest';

const userFindOne = vi.fn();
const tailorProfileFindOne = vi.fn();
const requestPostFind = vi.fn();

vi.mock('../../src/models/user.model.js', () => ({
  User: {
    findOne: userFindOne,
  },
}));

vi.mock('../../src/models/tailor-profile.model.js', () => ({
  TailorProfile: {
    findOne: tailorProfileFindOne,
  },
}));

vi.mock('../../src/models/request-post.model.js', () => ({
  RequestPost: {
    find: requestPostFind,
  },
}));

describe('tailor request visibility flow', () => {
  beforeEach(() => {
    userFindOne.mockReset();
    tailorProfileFindOne.mockReset();
    requestPostFind.mockReset();
  });

  it('returns paginated matching request leads for an onboarded tailor', async () => {
    const { getTailorRequestMatches } = await import(
      '../../src/bot/services/tailor-request-visibility.service.js'
    );

    userFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'user-1' }),
      }),
    });
    tailorProfileFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'tailor-1',
        location: { city: 'Lagos' },
        specialties: ['bridal'],
        styles: ['aso ebi'],
        budgetRange: { min: 30000, max: 150000, currency: 'NGN' },
      }),
    });
    requestPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              {
                _id: 'request-1',
                outfitType: 'dress',
                style: 'bridal dress',
                location: { city: 'Lagos', area: 'Lekki', country: 'Nigeria' },
                budgetRange: { min: 40000, max: 120000, currency: 'NGN' },
                dueDate: '2099-02-01T00:00:00.000Z',
                status: 'pending',
                createdAt: '2098-12-01T00:00:00.000Z',
              },
            ]),
          }),
        }),
      }),
    });

    const result = await getTailorRequestMatches({
      telegramUserId: '123',
      page: 0,
    });

    expect(result).toMatchObject({
      tailorProfile: expect.objectContaining({ _id: 'tailor-1' }),
      totalMatches: 1,
      page: 0,
      hasMore: false,
    });
    expect(result.items[0]).toMatchObject({
      _id: 'request-1',
      score: 10,
    });
  });
});
