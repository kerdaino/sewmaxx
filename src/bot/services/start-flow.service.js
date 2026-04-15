import { AffiliateProfile } from '../../models/affiliate-profile.model.js';
import { ClientProfile } from '../../models/client-profile.model.js';
import { TailorProfile } from '../../models/tailor-profile.model.js';
import { User } from '../../models/user.model.js';
import { sanitizeText } from '../../utils/sanitize.js';
import { resolveAffiliateByReferralCode } from '../../services/referral.service.js';

const roleCopy = Object.freeze({
  client: 'client',
  tailor: 'tailor',
  affiliate: 'affiliate',
});

export const syncTelegramUserFromContext = async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  const telegramUsername = sanitizeText(ctx.from?.username ?? '', 64);
  const firstName = sanitizeText(ctx.from?.first_name ?? '', 80);
  const lastName = sanitizeText(ctx.from?.last_name ?? '', 80);
  const languageCode = sanitizeText(ctx.from?.language_code ?? '', 12);

  const user = await User.findOneAndUpdate(
    { telegramUserId },
    {
      $setOnInsert: {
        telegramUserId,
      },
      $set: {
        telegramUsername,
        firstName,
        lastName,
        languageCode,
        status: 'active',
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  ).lean();

  return user;
};

const fetchExistingProfiles = async (userId) => {
  const [clientProfile, tailorProfile, affiliateProfile] = await Promise.all([
    ClientProfile.findOne({ userId }).select('_id').lean(),
    TailorProfile.findOne({ userId }).select('_id').lean(),
    AffiliateProfile.findOne({ userId }).select('_id affiliateCode').lean(),
  ]);

  return {
    clientProfile,
    tailorProfile,
    affiliateProfile,
  };
};

export const getStartFlowState = async (ctx) => {
  const user = await syncTelegramUserFromContext(ctx);
  const profiles = await fetchExistingProfiles(user._id);

  return {
    user,
    profiles,
    hasCompletedOnboarding: Boolean(
      profiles.clientProfile || profiles.tailorProfile || profiles.affiliateProfile,
    ),
  };
};

export const validateStartReferralCode = async ({ referralCode, telegramUserId }) => {
  if (!referralCode) {
    return {
      isValid: false,
      reason: 'missing',
    };
  }

  const normalizedCode = sanitizeText(referralCode, 24).toUpperCase();
  const affiliate = await resolveAffiliateByReferralCode(normalizedCode);
  const currentUser = await User.findOne({ telegramUserId }).select('_id').lean();

  if (currentUser && String(affiliate.userId) === String(currentUser._id)) {
    return {
      isValid: false,
      reason: 'self_referral',
    };
  }

  return {
    isValid: true,
    referralCode: normalizedCode,
    affiliateProfileId: affiliate._id,
  };
};

export const buildResumeMessage = ({ profiles }) => {
  const roles = [
    profiles.clientProfile ? roleCopy.client : null,
    profiles.tailorProfile ? roleCopy.tailor : null,
    profiles.affiliateProfile ? roleCopy.affiliate : null,
  ].filter(Boolean);

  if (roles.length === 0) {
    return null;
  }

  return `Welcome back to Sewmaxx. You're already set up as ${roles.join(', ')}. You can choose a role below to continue.`;
};
