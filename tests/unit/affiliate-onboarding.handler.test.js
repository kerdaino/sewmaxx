import { beforeEach, describe, expect, it, vi } from 'vitest';

const getExistingAffiliateProfile = vi.fn();
const buildAffiliateSummary = vi.fn();
const buildTelegramReferralLink = vi.fn();
const buildAffiliateSummaryKeyboard = vi.fn();

vi.mock('../../src/bot/services/affiliate-onboarding.service.js', () => ({
  getExistingAffiliateProfile,
  buildAffiliateSummary,
  completeAffiliateOnboarding: vi.fn(),
}));

vi.mock('../../src/bot/utils/build-telegram-referral-link.js', () => ({
  buildTelegramReferralLink,
}));

vi.mock('../../src/bot/keyboards/affiliate-onboarding.keyboard.js', () => ({
  buildAffiliateDisplayNameKeyboard: vi.fn(),
  buildAffiliateSummaryKeyboard,
}));

describe('affiliate onboarding resume logic', () => {
  beforeEach(() => {
    getExistingAffiliateProfile.mockReset();
    buildAffiliateSummary.mockReset();
    buildTelegramReferralLink.mockReset();
    buildAffiliateSummaryKeyboard.mockReset();
  });

  it('resumes with a summary for an already completed affiliate profile', async () => {
    const { startAffiliateOnboarding } = await import('../../src/bot/handlers/affiliate-onboarding.handler.js');
    const reply = vi.fn();

    getExistingAffiliateProfile.mockResolvedValue({
      affiliateCode: 'AFF-1234',
      onboardingCompletedAt: new Date().toISOString(),
      kycDetails: {
        idDocument: { telegramFileId: 'id-file' },
        selfieWithId: { telegramFileId: 'selfie-file' },
      },
    });
    buildTelegramReferralLink.mockReturnValue('https://t.me/sewmaxx_test_bot?start=AFF-1234');
    buildAffiliateSummary.mockReturnValue('Affiliate onboarding complete.');
    buildAffiliateSummaryKeyboard.mockReturnValue({ inline_keyboard: [] });

    const ctx = {
      from: { id: 99 },
      session: {},
      reply,
    };

    await startAffiliateOnboarding(ctx);

    expect(reply).toHaveBeenCalledWith(
      'Affiliate onboarding complete.',
      { inline_keyboard: [] },
    );
    expect(ctx.session.selectedRole).toBe('affiliate');
    expect(ctx.session.onboardingFlow).toBeNull();
  });
});
