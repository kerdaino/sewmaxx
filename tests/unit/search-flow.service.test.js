import { beforeEach, describe, expect, it, vi } from 'vitest';

const userFindOne = vi.fn();
const clientProfileFindOne = vi.fn();
const searchSessionCreate = vi.fn();
const searchTailors = vi.fn();

vi.mock('../../src/models/user.model.js', () => ({
  User: {
    findOne: userFindOne,
  },
}));

vi.mock('../../src/models/client-profile.model.js', () => ({
  ClientProfile: {
    findOne: clientProfileFindOne,
  },
}));

vi.mock('../../src/models/search-session.model.js', () => ({
  SearchSession: {
    create: searchSessionCreate,
  },
}));

vi.mock('../../src/services/search.service.js', () => ({
  searchTailors,
}));

describe('search flow service', () => {
  beforeEach(() => {
    userFindOne.mockReset();
    clientProfileFindOne.mockReset();
    searchSessionCreate.mockReset();
    searchTailors.mockReset();
  });

  it('creates a completed search session when matches are found', async () => {
    const { createSearchSession } = await import('../../src/bot/services/search-flow.service.js');

    userFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'user-1' }),
      }),
    });
    clientProfileFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'client-1',
        location: {
          country: 'Nigeria',
          area: 'Lekki',
          state: 'Lagos',
        },
      }),
    });
    searchTailors.mockResolvedValue([{ _id: 'tailor-1' }, { _id: 'tailor-2' }]);
    searchSessionCreate.mockResolvedValue({
      _id: 'search-1',
      status: 'completed',
    });

    const result = await createSearchSession({
      telegramUserId: '123',
      style: 'bridal',
      city: 'Lagos',
      budgetRange: { min: 10000, max: 50000, currency: 'NGN' },
    });

    expect(searchTailors).toHaveBeenCalledWith({
      city: 'Lagos',
      specialty: 'bridal',
      limit: 30,
      budgetRange: { min: 10000, max: 50000, currency: 'NGN' },
    });
    expect(searchSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        clientProfileId: 'client-1',
        matchedTailorIds: ['tailor-1', 'tailor-2'],
        matchedTailorCount: 2,
        status: 'completed',
      }),
    );
    expect(result).toEqual({
      searchSession: { _id: 'search-1', status: 'completed' },
      matches: [{ _id: 'tailor-1' }, { _id: 'tailor-2' }],
    });
  });

  it('creates an active search session when no matches are found', async () => {
    const { createSearchSession } = await import('../../src/bot/services/search-flow.service.js');

    userFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'user-1' }),
      }),
    });
    clientProfileFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'client-1',
        location: {
          country: 'Nigeria',
          area: 'Lekki',
          state: 'Lagos',
        },
      }),
    });
    searchTailors.mockResolvedValue([]);
    searchSessionCreate.mockResolvedValue({
      _id: 'search-1',
      status: 'active',
    });

    await createSearchSession({
      telegramUserId: '123',
      style: 'uniform',
      city: 'Lagos',
      budgetRange: { min: 10000, max: 50000, currency: 'NGN' },
    });

    expect(searchSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        matchedTailorIds: [],
        matchedTailorCount: 0,
        status: 'active',
      }),
    );
  });
});
