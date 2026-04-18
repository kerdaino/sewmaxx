import { beforeEach, describe, expect, it, vi } from 'vitest';

const affiliateProfileExists = vi.fn();
const affiliateProfileFindOneAndUpdate = vi.fn();
const clientProfileFindOneAndUpdate = vi.fn();
const tailorProfileFindOneAndUpdate = vi.fn();
const userFindOneAndUpdate = vi.fn();
const userUpdateOne = vi.fn();
const trackReferral = vi.fn();

vi.mock('../../src/models/affiliate-profile.model.js', () => ({
  AffiliateProfile: {
    exists: affiliateProfileExists,
    findOneAndUpdate: affiliateProfileFindOneAndUpdate,
  },
}));

vi.mock('../../src/models/client-profile.model.js', () => ({
  ClientProfile: {
    findOneAndUpdate: clientProfileFindOneAndUpdate,
  },
}));

vi.mock('../../src/models/tailor-profile.model.js', () => ({
  TailorProfile: {
    findOneAndUpdate: tailorProfileFindOneAndUpdate,
  },
}));

vi.mock('../../src/models/user.model.js', () => ({
  User: {
    findOneAndUpdate: userFindOneAndUpdate,
    updateOne: userUpdateOne,
  },
}));

vi.mock('../../src/services/referral.service.js', () => ({
  trackReferral,
}));

describe('onboarding service', () => {
  beforeEach(() => {
    affiliateProfileExists.mockReset();
    affiliateProfileFindOneAndUpdate.mockReset();
    clientProfileFindOneAndUpdate.mockReset();
    tailorProfileFindOneAndUpdate.mockReset();
    userFindOneAndUpdate.mockReset();
    userUpdateOne.mockReset();
    trackReferral.mockReset();

    userFindOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'user-1' }),
    });
    userUpdateOne.mockResolvedValue({ acknowledged: true });
  });

  it('creates an affiliate profile with a generated code and role sync', async () => {
    const { onboardAffiliate } = await import('../../src/services/onboarding.service.js');

    affiliateProfileExists.mockResolvedValue(false);
    affiliateProfileFindOneAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'affiliate-1',
          affiliateCode: 'AFF-1234',
          status: 'active',
        }),
      }),
    });

    const result = await onboardAffiliate({
      telegramUserId: '123',
      telegramUsername: 'affiliate_user',
      fullName: 'Ada Affiliate',
      displayName: '',
      phoneNumber: '08012345678',
      country: 'Nigeria',
      city: 'Lagos',
      kycDetails: {
        idDocument: { telegramFileId: 'affiliate-id-file', telegramFileType: 'document' },
        selfieWithId: { telegramFileId: 'affiliate-selfie-file', telegramFileType: 'photo' },
      },
    });

    expect(result).toMatchObject({
      _id: 'affiliate-1',
      affiliateCode: 'AFF-1234',
      status: 'active',
    });
    expect(affiliateProfileFindOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          fullName: 'Ada Affiliate',
          displayName: 'Ada Affiliate',
          phoneNumber: '08012345678',
          location: expect.objectContaining({
            country: 'Nigeria',
            city: 'Lagos',
          }),
          kycDetails: expect.objectContaining({
            legalPhoneNumber: '08012345678',
            country: 'Nigeria',
            city: 'Lagos',
            idDocument: expect.objectContaining({
              telegramFileId: 'affiliate-id-file',
            }),
            selfieWithId: expect.objectContaining({
              telegramFileId: 'affiliate-selfie-file',
            }),
          }),
        }),
      }),
      expect.any(Object),
    );
    expect(userUpdateOne).toHaveBeenCalledWith(
      { _id: 'user-1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          primaryRole: 'affiliate',
        }),
      }),
    );
  });

  it('rejects affiliate onboarding when required KYC uploads are missing', async () => {
    const { onboardAffiliate } = await import('../../src/services/onboarding.service.js');

    await expect(
      onboardAffiliate({
        telegramUserId: '123',
        telegramUsername: 'affiliate_user',
        fullName: 'Ada Affiliate',
        displayName: '',
        phoneNumber: '08012345678',
        country: 'Nigeria',
        city: 'Lagos',
        kycDetails: {
          idDocument: { telegramFileId: 'affiliate-id-file', telegramFileType: 'document' },
        },
      }),
    ).rejects.toMatchObject({
      message: 'Affiliate selfie with ID upload is required',
    });

    expect(userFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does not clear client referral linkage or style preferences when omitted on re-save', async () => {
    const { onboardClient } = await import('../../src/services/onboarding.service.js');

    clientProfileFindOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'client-1' }),
    });

    await onboardClient({
      telegramUserId: '123',
      telegramUsername: 'client_user',
      fullName: 'Ada Client',
      phoneNumber: '08012345678',
      country: 'Nigeria',
      city: 'Lagos',
      area: 'Lekki',
    });

    expect(clientProfileFindOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1' },
      expect.objectContaining({
        $set: expect.not.objectContaining({
          referredByAffiliateProfileId: expect.anything(),
          stylePreferences: expect.anything(),
        }),
      }),
      expect.any(Object),
    );
  });

  it('links a client onboarding record to a referral and style preferences when provided', async () => {
    const { onboardClient } = await import('../../src/services/onboarding.service.js');

    trackReferral.mockResolvedValue({ affiliateId: 'affiliate-1' });
    clientProfileFindOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'client-1' }),
    });

    await onboardClient({
      telegramUserId: '123',
      telegramUsername: 'client_user',
      fullName: 'Ada Client',
      phoneNumber: '08012345678',
      country: 'Nigeria',
      city: 'Lagos',
      area: 'Lekki',
      stylePreferences: ['bridal', 'aso ebi'],
      referralCode: 'AFF-1234',
    });

    expect(trackReferral).toHaveBeenCalledWith(
      expect.objectContaining({
        referralCode: 'AFF-1234',
        referredTelegramUserId: '123',
        referredUserType: 'client',
      }),
    );
    expect(clientProfileFindOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          referredByAffiliateProfileId: 'affiliate-1',
          stylePreferences: ['bridal', 'aso ebi'],
        }),
      }),
      expect.any(Object),
    );
  });

  it('rejects tailor onboarding when specialties are missing', async () => {
    const { onboardTailor } = await import('../../src/services/onboarding.service.js');

    await expect(
      onboardTailor({
        telegramUserId: '123',
        businessName: 'Ada Stitches',
        specialties: [],
      }),
    ).rejects.toMatchObject({
      message: 'At least one specialty is required',
    });

    expect(userFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('only applies the tailor default status on first insert', async () => {
    const { onboardTailor } = await import('../../src/services/onboarding.service.js');

    tailorProfileFindOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'tailor-1' }),
    });

    await onboardTailor({
      telegramUserId: '123',
      telegramUsername: 'tailor_user',
      fullName: 'Ada Tailor',
      businessName: 'Ada Stitches',
      publicName: 'Ada Stitches',
      phoneNumber: '08012345678',
      country: 'Nigeria',
      city: 'Lagos',
      area: 'Lekki',
      workAddress: '12 Marina',
      specialties: ['bridal'],
      budgetMin: 10000,
      budgetMax: 50000,
      currency: 'NGN',
      portfolio: [{ title: 'Look 1', assetKey: 'file-1', telegramFileId: 'file-1' }],
      kyc: {
        idDocument: { telegramFileId: 'id-file' },
        selfieWithId: { telegramFileId: 'selfie-file' },
        workplaceImage: { telegramFileId: 'workplace-file' },
      },
      onboardingAgreement: {
        requirementsAcknowledgedAt: '2026-04-18T10:00:00.000Z',
        termsReviewedAt: '2026-04-18T10:05:00.000Z',
        policiesAcceptedAt: '2026-04-18T10:06:00.000Z',
        pricingAcceptedAt: '2026-04-18T10:06:00.000Z',
        termsPdfUrl: 'https://example.com/terms.pdf',
      },
    });

    expect(tailorProfileFindOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1' },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          status: expect.any(String),
        }),
        $set: expect.objectContaining({
          portfolio: [{ title: 'Look 1', assetKey: 'file-1', telegramFileId: 'file-1' }],
          kyc: expect.objectContaining({
            idDocument: expect.objectContaining({ telegramFileId: 'id-file' }),
            selfieWithId: expect.objectContaining({ telegramFileId: 'selfie-file' }),
            workplaceImage: expect.objectContaining({ telegramFileId: 'workplace-file' }),
          }),
          onboardingAgreement: expect.objectContaining({
            termsPdfUrl: 'https://example.com/terms.pdf',
          }),
        }),
      }),
      expect.any(Object),
    );
    expect(tailorProfileFindOneAndUpdate.mock.calls[0][1].$set.status).toBeUndefined();
  });

  it('rejects tailor onboarding when required KYC, portfolio, or agreement data are missing', async () => {
    const { onboardTailor } = await import('../../src/services/onboarding.service.js');

    await expect(
      onboardTailor({
        telegramUserId: '123',
        telegramUsername: 'tailor_user',
        fullName: 'Ada Tailor',
        businessName: 'Ada Stitches',
        publicName: 'Ada Stitches',
        phoneNumber: '08012345678',
        country: 'Nigeria',
        city: 'Lagos',
        area: 'Lekki',
        workAddress: '12 Marina',
        specialties: ['bridal'],
        budgetMin: 10000,
        budgetMax: 50000,
        portfolio: [{ title: 'Look 1', assetKey: 'file-1', telegramFileId: 'file-1' }],
        kyc: {
          idDocument: { telegramFileId: 'id-file' },
          workplaceImage: { telegramFileId: 'workplace-file' },
        },
        onboardingAgreement: {
          requirementsAcknowledgedAt: '2026-04-18T10:00:00.000Z',
          termsReviewedAt: '2026-04-18T10:05:00.000Z',
          policiesAcceptedAt: '2026-04-18T10:06:00.000Z',
          pricingAcceptedAt: '2026-04-18T10:06:00.000Z',
          termsPdfUrl: 'https://example.com/terms.pdf',
        },
      }),
    ).rejects.toMatchObject({
      message: 'Tailor selfie with ID upload is required',
    });

    expect(userFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('captures tailor referrals when a referral code is supplied', async () => {
    const { onboardTailor } = await import('../../src/services/onboarding.service.js');

    trackReferral.mockResolvedValue({ affiliateId: 'affiliate-1' });
    tailorProfileFindOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'tailor-1' }),
    });

    await onboardTailor({
      telegramUserId: '123',
      telegramUsername: 'tailor_user',
      fullName: 'Ada Tailor',
      businessName: 'Ada Stitches',
      publicName: 'Ada Stitches',
      phoneNumber: '08012345678',
      country: 'Nigeria',
      city: 'Lagos',
      area: 'Lekki',
      workAddress: '12 Marina',
      specialties: ['bridal'],
      budgetMin: 10000,
      budgetMax: 50000,
      currency: 'NGN',
      portfolio: [{ title: 'Look 1', assetKey: 'file-1', telegramFileId: 'file-1' }],
      kyc: {
        idDocument: { telegramFileId: 'id-file' },
        selfieWithId: { telegramFileId: 'selfie-file' },
        workplaceImage: { telegramFileId: 'workplace-file' },
      },
      onboardingAgreement: {
        requirementsAcknowledgedAt: '2026-04-18T10:00:00.000Z',
        termsReviewedAt: '2026-04-18T10:05:00.000Z',
        policiesAcceptedAt: '2026-04-18T10:06:00.000Z',
        pricingAcceptedAt: '2026-04-18T10:06:00.000Z',
        termsPdfUrl: 'https://example.com/terms.pdf',
      },
      referralCode: 'AFF-1234',
    });

    expect(trackReferral).toHaveBeenCalledWith(
      expect.objectContaining({
        referralCode: 'AFF-1234',
        referredTelegramUserId: '123',
        referredUserType: 'tailor',
      }),
    );
  });
});
