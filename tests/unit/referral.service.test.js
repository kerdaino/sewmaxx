import { beforeEach, describe, expect, it, vi } from 'vitest';

const affiliateProfileFindOne = vi.fn();
const referralFindOne = vi.fn();
const referralFindOneAndUpdate = vi.fn();
const userFindOne = vi.fn();

vi.mock('../../src/models/affiliate-profile.model.js', () => ({
  AffiliateProfile: {
    findOne: affiliateProfileFindOne,
  },
}));

vi.mock('../../src/models/referral.model.js', () => ({
  Referral: {
    findOne: referralFindOne,
    findOneAndUpdate: referralFindOneAndUpdate,
  },
}));

vi.mock('../../src/models/user.model.js', () => ({
  User: {
    findOne: userFindOne,
  },
}));

describe('referral service', () => {
  beforeEach(() => {
    affiliateProfileFindOne.mockReset();
    referralFindOne.mockReset();
    referralFindOneAndUpdate.mockReset();
    userFindOne.mockReset();

    affiliateProfileFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'affiliate-1',
        userId: 'user-1',
        affiliateCode: 'AFF-1234',
      }),
    });

    userFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    });
  });

  it('captures a referral and returns the affiliate linkage', async () => {
    const { trackReferral } = await import('../../src/services/referral.service.js');

    referralFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    });
    referralFindOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'referral-1',
      }),
    });

    const result = await trackReferral({
      referralCode: 'AFF-1234',
      referredTelegramUserId: '123',
      referredUserType: 'client',
      source: 'api',
    });

    expect(result).toEqual({
      affiliateId: 'affiliate-1',
      referralId: 'referral-1',
      referralCode: 'AFF-1234',
    });
    expect(referralFindOneAndUpdate).toHaveBeenCalledWith(
      {
        affiliateProfileId: 'affiliate-1',
        referredTelegramUserId: '123',
        referredRole: 'client',
      },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          referralCode: 'AFF-1234',
          affiliateProfileId: 'affiliate-1',
          affiliateUserId: 'user-1',
        }),
        $set: {
          referredUserId: null,
        },
      }),
      expect.any(Object),
    );
  });

  it('rejects referrals that would attach the same user-role record to a different affiliate', async () => {
    const { trackReferral } = await import('../../src/services/referral.service.js');

    referralFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          affiliateProfileId: 'affiliate-2',
        }),
      }),
    });

    await expect(
      trackReferral({
        referralCode: 'AFF-1234',
        referredTelegramUserId: '123',
        referredUserType: 'client',
        source: 'api',
      }),
    ).rejects.toMatchObject({
      message: 'This user has already been linked to another affiliate referral',
    });

    expect(referralFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects self-referrals when the referred user belongs to the affiliate', async () => {
    const { trackReferral } = await import('../../src/services/referral.service.js');

    userFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'user-1' }),
      }),
    });

    await expect(
      trackReferral({
        referralCode: 'AFF-1234',
        referredTelegramUserId: '123',
        referredUserType: 'tailor',
        source: 'telegram_start',
      }),
    ).rejects.toMatchObject({
      message: 'You cannot use your own affiliate referral code',
    });

    expect(referralFindOne).not.toHaveBeenCalled();
    expect(referralFindOneAndUpdate).not.toHaveBeenCalled();
  });
});
