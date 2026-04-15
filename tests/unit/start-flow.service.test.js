import { beforeEach, describe, expect, it, vi } from 'vitest';

const affiliateProfileFindOne = vi.fn();
const clientProfileFindOne = vi.fn();
const tailorProfileFindOne = vi.fn();
const userFindOne = vi.fn();
const userFindOneAndUpdate = vi.fn();
const resolveAffiliateByReferralCode = vi.fn();

vi.mock('../../src/models/affiliate-profile.model.js', () => ({
  AffiliateProfile: {
    findOne: affiliateProfileFindOne,
  },
}));

vi.mock('../../src/models/client-profile.model.js', () => ({
  ClientProfile: {
    findOne: clientProfileFindOne,
  },
}));

vi.mock('../../src/models/tailor-profile.model.js', () => ({
  TailorProfile: {
    findOne: tailorProfileFindOne,
  },
}));

vi.mock('../../src/models/user.model.js', () => ({
  User: {
    findOne: userFindOne,
    findOneAndUpdate: userFindOneAndUpdate,
  },
}));

vi.mock('../../src/services/referral.service.js', () => ({
  resolveAffiliateByReferralCode,
}));

describe('start flow service', () => {
  beforeEach(() => {
    affiliateProfileFindOne.mockReset();
    clientProfileFindOne.mockReset();
    tailorProfileFindOne.mockReset();
    userFindOne.mockReset();
    userFindOneAndUpdate.mockReset();
    resolveAffiliateByReferralCode.mockReset();
  });

  it('rejects self-referrals safely', async () => {
    const { validateStartReferralCode } = await import('../../src/bot/services/start-flow.service.js');

    resolveAffiliateByReferralCode.mockResolvedValue({
      _id: 'affiliate-profile-id',
      userId: 'user-123',
    });
    userFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'user-123' }),
      }),
    });

    const result = await validateStartReferralCode({
      referralCode: 'aff-code',
      telegramUserId: '123',
    });

    expect(result).toEqual({
      isValid: false,
      reason: 'self_referral',
    });
  });

  it('builds a resume message when profiles already exist', async () => {
    const { buildResumeMessage } = await import('../../src/bot/services/start-flow.service.js');

    const message = buildResumeMessage({
      profiles: {
        clientProfile: { _id: 'client-1' },
        tailorProfile: null,
        affiliateProfile: { _id: 'affiliate-1' },
      },
    });

    expect(message).toContain('client, affiliate');
  });
});
