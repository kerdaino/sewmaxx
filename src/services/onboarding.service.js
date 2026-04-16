import { StatusCodes } from 'http-status-codes';
import { AffiliateProfile } from '../models/affiliate-profile.model.js';
import { ClientProfile } from '../models/client-profile.model.js';
import { TailorProfile } from '../models/tailor-profile.model.js';
import { User } from '../models/user.model.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { trackReferral } from './referral.service.js';
import { generateReferralCode } from '../utils/referral-code.js';

const buildUpsertOptions = () => ({
  new: true,
  upsert: true,
  runValidators: true,
  setDefaultsOnInsert: true,
  context: 'query',
});

const createAffiliateProfile = async (userId, payload, completedAt) =>
  AffiliateProfile.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        affiliateCode: await generateUniqueAffiliateCode(),
      },
      $set: {
        fullName: payload.fullName,
        displayName: payload.displayName || payload.fullName,
        phoneNumber: payload.phoneNumber ?? '',
        onboardingCompletedAt: completedAt,
      },
    },
    buildUpsertOptions(),
  ).lean();

const generateUniqueAffiliateCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateReferralCode('AFF');
    const existing = await AffiliateProfile.exists({ affiliateCode: candidate });

    if (!existing) {
      return candidate;
    }
  }

  throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Unable to create affiliate code');
};

const upsertUser = async (payload, primaryRole) =>
  User.findOneAndUpdate(
    { telegramUserId: payload.telegramUserId },
    {
      $setOnInsert: {
        telegramUserId: payload.telegramUserId,
      },
      $set: {
        telegramUsername: payload.telegramUsername ?? '',
        firstName: payload.fullName?.split(' ')[0] ?? payload.businessName?.split(' ')[0] ?? '',
        lastName: payload.fullName?.split(' ').slice(1).join(' ') ?? '',
        primaryRole,
      },
      $addToSet: {
        roles: primaryRole,
      },
    },
    buildUpsertOptions(),
  ).lean();

export const onboardAffiliate = async (payload) => {
  const user = await upsertUser(payload, 'affiliate');
  const completedAt = new Date();

  let affiliate = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      affiliate = await createAffiliateProfile(user._id, payload, completedAt);
      break;
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.affiliateCode) {
        continue;
      }

      throw error;
    }
  }

  if (!affiliate) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Unable to create affiliate profile');
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        primaryRole: 'affiliate',
        'onboarding.affiliateCompletedAt': completedAt,
      },
      $addToSet: {
        roles: 'affiliate',
      },
    },
  );

  return affiliate;
};

export const onboardClient = async (payload) => {
  let referredByAffiliateProfileId = null;

  if (payload.referralCode) {
    const referral = await trackReferral({
      referralCode: payload.referralCode,
      referredTelegramUserId: payload.telegramUserId,
      referredUserType: 'client',
      source: 'api',
    });

    referredByAffiliateProfileId = referral.affiliateId;
  }

  const user = await upsertUser(payload, 'client');
  const completedAt = new Date();

  const client = await ClientProfile.findOneAndUpdate(
    { userId: user._id },
    {
      $setOnInsert: {
        userId: user._id,
      },
      $set: {
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber ?? '',
        location: {
          city: payload.city,
          state: payload.state ?? '',
          country: payload.country,
          area: payload.area ?? '',
        },
        stylePreferences: payload.stylePreferences ?? [],
        referredByAffiliateProfileId,
        onboardingCompletedAt: completedAt,
      },
    },
    buildUpsertOptions(),
  ).lean();

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        primaryRole: 'client',
        'onboarding.clientCompletedAt': completedAt,
      },
      $addToSet: {
        roles: 'client',
      },
    },
  );

  return client;
};

export const onboardTailor = async (payload) => {
  if (!Array.isArray(payload.specialties) || payload.specialties.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'At least one specialty is required');
  }

  if (payload.referralCode) {
    await trackReferral({
      referralCode: payload.referralCode,
      referredTelegramUserId: payload.telegramUserId,
      referredUserType: 'tailor',
      source: 'api',
    });
  }

  const user = await upsertUser(payload, 'tailor');
  const completedAt = new Date();

  const tailor = await TailorProfile.findOneAndUpdate(
    { userId: user._id },
    {
      $setOnInsert: {
        userId: user._id,
      },
      $set: {
        fullName: payload.fullName,
        businessName: payload.businessName,
        publicName: payload.publicName || payload.businessName,
        phoneNumber: payload.phoneNumber ?? '',
        location: {
          city: payload.city,
          state: payload.state ?? '',
          country: payload.country,
          area: payload.area ?? '',
        },
        workAddress: payload.workAddress,
        styles: payload.specialties,
        specialties: payload.specialties,
        budgetRange: {
          min: payload.budgetMin ?? null,
          max: payload.budgetMax ?? null,
          currency: payload.currency ?? 'NGN',
        },
        status: env.TAILOR_DEFAULT_STATUS,
        onboardingCompletedAt: completedAt,
      },
    },
    buildUpsertOptions(),
  ).lean();

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        primaryRole: 'tailor',
        'onboarding.tailorCompletedAt': completedAt,
      },
      $addToSet: {
        roles: 'tailor',
      },
    },
  );

  return tailor;
};
