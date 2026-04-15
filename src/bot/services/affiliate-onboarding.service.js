import { AffiliateProfile } from '../../models/affiliate-profile.model.js';
import { User } from '../../models/user.model.js';
import { onboardAffiliate } from '../../services/onboarding.service.js';
import { buildTelegramReferralLink } from '../utils/build-telegram-referral-link.js';

export const getExistingAffiliateProfile = async (telegramUserId) => {
  const user = await User.findOne({ telegramUserId }).select('_id').lean();

  if (!user) {
    return null;
  }

  return AffiliateProfile.findOne({ userId: user._id }).lean();
};

export const completeAffiliateOnboarding = async ({ telegramUserId, telegramUsername, fullName, displayName }) => {
  const affiliate = await onboardAffiliate({
    telegramUserId,
    telegramUsername,
    fullName,
    displayName,
  });

  return {
    affiliate,
    referralLink: buildTelegramReferralLink(affiliate.affiliateCode),
  };
};

export const buildAffiliateSummary = ({ affiliate, referralLink }) => {
  const summaryLines = [
    'Affiliate onboarding complete.',
    '',
    `Full name: ${affiliate.fullName}`,
    `Display name: ${affiliate.displayName}`,
    `Affiliate code: ${affiliate.affiliateCode}`,
    `Status: ${affiliate.status}`,
  ];

  if (referralLink) {
    summaryLines.push(`Referral link: ${referralLink}`);
  } else {
    summaryLines.push('Referral link: unavailable until TELEGRAM_BOT_USERNAME is configured');
  }

  return summaryLines.join('\n');
};
