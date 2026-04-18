import { TailorProfile } from '../../models/tailor-profile.model.js';
import { User } from '../../models/user.model.js';
import { onboardTailor } from '../../services/onboarding.service.js';

export const getExistingTailorProfile = async (telegramUserId) => {
  const user = await User.findOne({ telegramUserId }).select('_id').lean();

  if (!user) {
    return null;
  }

  return TailorProfile.findOne({ userId: user._id }).lean();
};

export const completeTailorOnboarding = async ({
  telegramUserId,
  telegramUsername,
  fullName,
  phoneNumber,
  businessName,
  publicName,
  country,
  city,
  area,
  workAddress,
  specialties,
  budgetRange,
  portfolio,
  kyc,
  onboardingAgreement,
}) => {
  const tailor = await onboardTailor({
    telegramUserId,
    telegramUsername,
    fullName,
    phoneNumber,
    businessName,
    publicName,
    country,
    city,
    area,
    workAddress,
    specialties,
    budgetMin: budgetRange.min,
    budgetMax: budgetRange.max,
    currency: budgetRange.currency,
    portfolio,
    kyc,
    onboardingAgreement,
  });

  return {
    ...tailor,
    location: {
      country,
      city,
      area: area ?? '',
      ...(tailor.location ?? {}),
    },
    specialties: Array.isArray(tailor.specialties) ? tailor.specialties : specialties,
    portfolio: Array.isArray(tailor.portfolio) ? tailor.portfolio : portfolio ?? [],
    budgetRange:
      tailor.budgetRange ?? {
        min: budgetRange.min,
        max: budgetRange.max,
        currency: budgetRange.currency ?? 'NGN',
      },
    kyc: tailor.kyc ?? kyc ?? {},
    onboardingAgreement: tailor.onboardingAgreement ?? onboardingAgreement ?? {},
    status: tailor.status ?? 'pending_review',
    verificationStatus: tailor.verificationStatus ?? 'pending',
  };
};

export const buildTailorSummary = ({ tailor }) => {
  const location = tailor.location ?? {};
  const specialties = Array.isArray(tailor.specialties) ? tailor.specialties : [];
  const portfolio = Array.isArray(tailor.portfolio) ? tailor.portfolio : [];
  const budgetRange = tailor.budgetRange ?? {};
  const kyc = tailor.kyc ?? {};
  const summaryLines = [
    'Tailor onboarding complete.',
    '',
    'Your tailor profile has been submitted for review.',
    '',
    `Full name: ${tailor.fullName}`,
    `Business name: ${tailor.businessName}`,
    `Public name: ${tailor.publicName}`,
    `Country: ${location.country ?? 'Not set'}`,
    `City: ${location.city ?? 'Not set'}`,
    `Work address: ${tailor.workAddress}`,
    `Specialties: ${specialties.length > 0 ? specialties.join(', ') : 'Not set'}`,
    `Profile status: ${tailor.status ?? 'pending_review'}`,
    `Verification: ${tailor.verificationStatus ?? 'pending'}`,
    `Portfolio uploads: ${portfolio.length}`,
    `ID submitted: ${kyc.idDocument?.telegramFileId ? 'Yes' : 'No'}`,
    `Workplace image uploaded: ${kyc.workplaceImage?.telegramFileId ? 'Yes' : 'No'}`,
    `Selfie with ID submitted: ${kyc.selfieWithId?.telegramFileId ? 'Yes' : 'No'}`,
  ];

  if (budgetRange.min !== null && budgetRange.min !== undefined && budgetRange.max !== null && budgetRange.max !== undefined) {
    summaryLines.push(
      `Service range: ${budgetRange.currency ?? 'NGN'} ${budgetRange.min} - ${budgetRange.max}`,
    );
  } else {
    summaryLines.push('Service range: not set');
  }

  return summaryLines.join('\n');
};
