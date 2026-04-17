import { beforeEach, describe, expect, it, vi } from 'vitest';

const userFindOne = vi.fn();
const clientProfileFindOne = vi.fn();
const requestPostFindOne = vi.fn();
const requestPostCreate = vi.fn();

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

vi.mock('../../src/models/request-post.model.js', () => ({
  RequestPost: {
    findOne: requestPostFindOne,
    create: requestPostCreate,
  },
}));

describe('request service', () => {
  beforeEach(() => {
    userFindOne.mockReset();
    clientProfileFindOne.mockReset();
    requestPostFindOne.mockReset();
    requestPostCreate.mockReset();

    userFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'user-1' }),
    });
    clientProfileFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'client-1' }),
    });
  });

  it('creates a pending request post for an onboarded client', async () => {
    const { createServiceRequest } = await import('../../src/services/request.service.js');

    requestPostFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    });
    requestPostCreate.mockResolvedValue({
      _id: 'request-1',
      status: 'pending',
      createdAt: '2026-04-17T10:00:00.000Z',
    });

    const result = await createServiceRequest({
      clientTelegramUserId: '123',
      outfitType: 'other',
      style: 'aso ebi gown',
      notes: '',
      country: 'Nigeria',
      city: 'Lagos',
      area: 'Lekki',
      budgetMin: 10000,
      budgetMax: 50000,
      currency: 'NGN',
      dueDate: new Date('2099-01-01T00:00:00.000Z'),
    });

    expect(result).toEqual({
      id: 'request-1',
      status: 'pending',
      createdAt: '2026-04-17T10:00:00.000Z',
    });
    expect(requestPostCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientProfileId: 'client-1',
        userId: 'user-1',
        outfitType: 'other',
        style: 'aso ebi gown',
        status: 'pending',
        coordinatorStatus: 'unreviewed',
      }),
    );
  });

  it('prevents duplicate active request posts', async () => {
    const { createServiceRequest } = await import('../../src/services/request.service.js');

    requestPostFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'request-1',
          status: 'pending',
        }),
      }),
    });

    await expect(
      createServiceRequest({
        clientTelegramUserId: '123',
        outfitType: 'dress',
        style: 'dress',
        notes: '',
        country: 'Nigeria',
        city: 'Lagos',
        area: 'Lekki',
        budgetMin: 10000,
        budgetMax: 50000,
        currency: 'NGN',
        dueDate: new Date('2099-01-01T00:00:00.000Z'),
      }),
    ).rejects.toMatchObject({
      message: 'A similar active request already exists',
    });

    expect(requestPostCreate).not.toHaveBeenCalled();
  });
});
