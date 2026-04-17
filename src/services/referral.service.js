import { StatusCodes } from 'http-status-codes';
import { AffiliateProfile } from '../models/affiliate-profile.model.js';
import { Referral } from '../models/referral.model.js';
import { User } from '../models/user.model.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';

export const resolveAffiliateByReferralCode = async (referralCode) => {
  const affiliate = await AffiliateProfile.findOne({ affiliateCode: referralCode }).lean();

  if (!affiliate) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Referral code not found');
  }

  return affiliate;
};

export const trackReferral = async (payload) => {
  const affiliate = await resolveAffiliateByReferralCode(payload.referralCode);
  const referredUser = await User.findOne({ telegramUserId: payload.referredTelegramUserId })
    .select('_id')
    .lean();

  if (referredUser && String(affiliate.userId) === String(referredUser._id)) {
    logger.warn(
      {
        event: 'referral_self_referral_rejected',
        affiliateProfileId: affiliate._id,
        referredRole: payload.referredUserType,
      },
      'Referral rejected because the user attempted to use their own affiliate code',
    );
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot use your own affiliate referral code');
  }

  const existingReferral = await Referral.findOne({
    referredTelegramUserId: payload.referredTelegramUserId,
    referredRole: payload.referredUserType,
  })
    .select('affiliateProfileId')
    .lean();

  if (
    existingReferral &&
    String(existingReferral.affiliateProfileId) !== String(affiliate._id)
  ) {
    logger.warn(
      {
        event: 'referral_conflict_rejected',
        affiliateProfileId: affiliate._id,
        existingAffiliateProfileId: existingReferral.affiliateProfileId,
        referredRole: payload.referredUserType,
      },
      'Referral rejected because the user was already linked to another affiliate',
    );
    throw new ApiError(
      StatusCodes.CONFLICT,
      'This user has already been linked to another affiliate referral',
    );
  }

  const referral = await Referral.findOneAndUpdate(
    {
      affiliateProfileId: affiliate._id,
      referredTelegramUserId: payload.referredTelegramUserId,
      referredRole: payload.referredUserType,
    },
    {
      $setOnInsert: {
        referralCode: affiliate.affiliateCode,
        affiliateProfileId: affiliate._id,
        affiliateUserId: affiliate.userId,
        referredTelegramUserId: payload.referredTelegramUserId,
        referredRole: payload.referredUserType,
        source: payload.source,
      },
      $set: {
        referredUserId: referredUser?._id ?? null,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      context: 'query',
    },
  ).lean();

  logger.info(
    {
      event: 'referral_captured',
      referralId: referral._id,
      affiliateProfileId: affiliate._id,
      affiliateUserId: affiliate.userId,
      referredRole: payload.referredUserType,
      source: payload.source,
      hasReferredUserRecord: Boolean(referredUser?._id),
    },
    'Referral captured successfully',
  );

  return {
    affiliateId: affiliate._id,
    referralId: referral._id,
    referralCode: affiliate.affiliateCode,
  };
};
