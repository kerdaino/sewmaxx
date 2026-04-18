import { AffiliateProfile } from '../../models/affiliate-profile.model.js';
import { User } from '../../models/user.model.js';
import { onboardAffiliate } from '../../services/onboarding.service.js';
import { buildTelegramReferralLink } from '../utils/build-telegram-referral-link.js';

export const getExistingAffiliateProfile = async (telegramUserId) => {
  const user = await User.findOne({ telegramUserId }).select('_id').lean();

  if (!user) {
    return null;
  }

  return AffiliateProfile.findOne({ userId: user._id })
    .select(
      '+phoneNumber +kycDetails.legalPhoneNumber +kycDetails.country +kycDetails.city +kycDetails.idDocument.telegramFileId +kycDetails.idDocument.telegramFileUniqueId +kycDetails.idDocument.telegramFileType +kycDetails.idDocument.mimeType +kycDetails.idDocument.fileName +kycDetails.idDocument.submittedAt +kycDetails.selfieWithId.telegramFileId +kycDetails.selfieWithId.telegramFileUniqueId +kycDetails.selfieWithId.telegramFileType +kycDetails.selfieWithId.mimeType +kycDetails.selfieWithId.fileName +kycDetails.selfieWithId.submittedAt',
    )
    .lean();
};

export const completeAffiliateOnboarding = async ({
  telegramUserId,
  telegramUsername,
  fullName,
  displayName,
  phoneNumber,
  country,
  city,
  kycDetails,
}) => {
  const affiliate = await onboardAffiliate({
    telegramUserId,
    telegramUsername,
    fullName,
    displayName,
    phoneNumber,
    country,
    city,
    kycDetails,
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
    `Phone number: ${affiliate.phoneNumber || affiliate.kycDetails?.legalPhoneNumber || 'Not set'}`,
    `Country: ${affiliate.location?.country ?? affiliate.kycDetails?.country ?? 'Not set'}`,
    `City: ${affiliate.location?.city ?? affiliate.kycDetails?.city ?? 'Not set'}`,
    `ID submitted: ${affiliate.kycDetails?.idDocument?.telegramFileId ? 'Yes' : 'No'}`,
    `Selfie with ID submitted: ${affiliate.kycDetails?.selfieWithId?.telegramFileId ? 'Yes' : 'No'}`,
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
