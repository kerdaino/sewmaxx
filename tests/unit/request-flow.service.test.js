import { beforeEach, describe, expect, it, vi } from 'vitest';

const createServiceRequest = vi.fn();
const userFindOne = vi.fn();
const clientProfileFindOne = vi.fn();

vi.mock('../../src/services/request.service.js', () => ({
  createServiceRequest,
}));

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

describe('request flow service', () => {
  beforeEach(() => {
    createServiceRequest.mockReset();
    userFindOne.mockReset();
    clientProfileFindOne.mockReset();
  });

  it('maps request publishing data correctly', async () => {
    const { publishRequestPost } = await import('../../src/bot/services/request-flow.service.js');

    createServiceRequest.mockResolvedValue({ id: 'req-1', status: 'published' });

    await publishRequestPost({
      telegramUserId: '123',
      outfitType: 'other',
      style: 'custom asooke gown',
      budgetRange: { min: 10000, max: 50000, currency: 'NGN' },
      location: { country: 'Nigeria', city: 'Lagos', area: 'Lekki' },
      dueDate: new Date('2099-01-01T00:00:00.000Z'),
    });

    expect(createServiceRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        clientTelegramUserId: '123',
        outfitType: 'other',
        style: 'custom asooke gown',
        country: 'Nigeria',
        city: 'Lagos',
        area: 'Lekki',
      }),
    );
  });
});
