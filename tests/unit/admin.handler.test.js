import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAdminTailorReview = vi.fn();
const getAdminAffiliateReview = vi.fn();
const isTelegramAdmin = vi.fn();

vi.mock('../../src/services/admin.service.js', () => ({
  getAdminAffiliateReview,
  getAdminTailorReview,
  listRecentAffiliates: vi.fn(),
  listRecentClientRequests: vi.fn(),
  listRecentTailorSignups: vi.fn(),
  updateAffiliateApprovalStatus: vi.fn(),
  updateRequestManagementStatus: vi.fn(),
  updateTailorApprovalStatus: vi.fn(),
}));

vi.mock('../../src/bot/services/admin-access.service.js', () => ({
  isTelegramAdmin,
}));

describe('admin handler private review delivery', () => {
  beforeEach(() => {
    getAdminTailorReview.mockReset();
    getAdminAffiliateReview.mockReset();
    isTelegramAdmin.mockReset();
    isTelegramAdmin.mockReturnValue(true);
  });

  it('sends tailor summary plus uploaded KYC and portfolio files to admin chat', async () => {
    const { handleAdminTailorDetailCommand } = await import('../../src/bot/handlers/admin.handler.js');

    getAdminTailorReview.mockResolvedValue({
      _id: 'tailor-1',
      fullName: 'Ada Tailor',
      publicName: 'Ada Bridal',
      businessName: 'Ada Stitches',
      phoneNumber: '08012345678',
      userId: { telegramUsername: 'ada_tailor' },
      location: { country: 'Nigeria', city: 'Lagos' },
      workAddress: '12 Marina',
      specialties: ['Bridal'],
      budgetRange: { min: 15000, max: 85000, currency: 'NGN' },
      onboardingAgreement: {
        requirementsAcknowledgedAt: '2026-04-18T09:59:00.000Z',
        termsReviewedAt: '2026-04-18T10:00:00.000Z',
        policiesAcceptedAt: '2026-04-18T10:01:00.000Z',
        pricingAcceptedAt: '2026-04-18T10:01:00.000Z',
        termsPdfUrl: 'https://example.com/terms.pdf',
      },
      kyc: {
        idDocument: { telegramFileId: 'id-file', telegramFileType: 'document' },
        selfieWithId: { telegramFileId: 'selfie-file', telegramFileType: 'photo' },
        workplaceImage: { telegramFileId: 'workplace-file', telegramFileType: 'photo' },
      },
      portfolio: [
        { telegramFileId: 'portfolio-1', telegramFileType: 'photo' },
        { telegramFileId: 'portfolio-2', telegramFileType: 'document' },
      ],
    });

    const ctx = {
      from: { id: 99 },
      message: { text: '/admin_tailor_detail 507f1f77bcf86cd799439011' },
      reply: vi.fn(),
      replyWithPhoto: vi.fn(),
      replyWithDocument: vi.fn(),
    };

    await handleAdminTailorDetailCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Tailor private review'));
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Service range: NGN 15000 - 85000'));
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Requirements acknowledged: Yes'));
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Terms PDF: https://example.com/terms.pdf'));
    expect(ctx.replyWithDocument).toHaveBeenCalledWith(
      'id-file',
      expect.objectContaining({
        caption: expect.stringContaining('Tailor ID upload'),
      }),
    );
    expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
      'selfie-file',
      expect.objectContaining({
        caption: expect.stringContaining('Tailor selfie with ID'),
      }),
    );
    expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
      'workplace-file',
      expect.objectContaining({
        caption: expect.stringContaining('Tailor workplace image'),
      }),
    );
    expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
      'portfolio-1',
      expect.objectContaining({
        caption: expect.stringContaining('Portfolio upload 1 of 2'),
      }),
    );
    expect(ctx.replyWithDocument).toHaveBeenCalledWith(
      'portfolio-2',
      expect.objectContaining({
        caption: expect.stringContaining('Portfolio upload 2 of 2'),
      }),
    );
  });

  it('sends affiliate summary plus uploaded KYC files to admin chat', async () => {
    const { handleAdminAffiliateDetailCommand } = await import('../../src/bot/handlers/admin.handler.js');

    getAdminAffiliateReview.mockResolvedValue({
      _id: 'affiliate-1',
      fullName: 'Ada Affiliate',
      displayName: 'Ada Style Connect',
      affiliateCode: 'AFF-1234',
      phoneNumber: '08012345678',
      userId: { telegramUsername: 'ada_affiliate' },
      location: { country: 'Nigeria', city: 'Lagos' },
      verificationStatus: 'pending',
      status: 'active',
      kycDetails: {
        country: 'Nigeria',
        city: 'Lagos',
        idDocument: { telegramFileId: 'affiliate-id-file', telegramFileType: 'document' },
        selfieWithId: { telegramFileId: 'affiliate-selfie-file', telegramFileType: 'photo' },
      },
    });

    const ctx = {
      from: { id: 99 },
      message: { text: '/admin_affiliate_detail 507f1f77bcf86cd799439011' },
      reply: vi.fn(),
      replyWithPhoto: vi.fn(),
      replyWithDocument: vi.fn(),
    };

    await handleAdminAffiliateDetailCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Affiliate private review'));
    expect(ctx.replyWithDocument).toHaveBeenCalledWith(
      'affiliate-id-file',
      expect.objectContaining({
        caption: expect.stringContaining('Affiliate ID upload'),
      }),
    );
    expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
      'affiliate-selfie-file',
      expect.objectContaining({
        caption: expect.stringContaining('Affiliate selfie with ID'),
      }),
    );
  });
});
