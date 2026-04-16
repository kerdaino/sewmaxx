import { StatusCodes } from 'http-status-codes';
import { AffiliateProfile } from '../models/affiliate-profile.model.js';
import { Referral } from '../models/referral.model.js';
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
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      context: 'query',
    },
  ).lean();

  return {
    affiliateId: affiliate._id,
    referralId: referral._id,
    referralCode: affiliate.affiliateCode,
  };
};
