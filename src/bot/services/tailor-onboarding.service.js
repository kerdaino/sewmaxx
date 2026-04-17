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
    portfolio: Array.isArray(tailor.portfolio) ? tailor.portfolio : [],
    budgetRange:
      tailor.budgetRange ?? {
        min: budgetRange.min,
        max: budgetRange.max,
        currency: budgetRange.currency ?? 'NGN',
      },
    status: tailor.status ?? 'pending_review',
    verificationStatus: tailor.verificationStatus ?? 'pending',
  };
};

export const buildTailorSummary = ({ tailor }) => {
  const location = tailor.location ?? {};
  const specialties = Array.isArray(tailor.specialties) ? tailor.specialties : [];
  const portfolio = Array.isArray(tailor.portfolio) ? tailor.portfolio : [];
  const budgetRange = tailor.budgetRange ?? {};
  const summaryLines = [
    'Tailor onboarding complete.',
    '',
    `Full name: ${tailor.fullName}`,
    `Business name: ${tailor.businessName}`,
    `Public name: ${tailor.publicName}`,
    `Country: ${location.country ?? 'Not set'}`,
    `City: ${location.city ?? 'Not set'}`,
    `Work address: ${tailor.workAddress}`,
    `Specialties: ${specialties.length > 0 ? specialties.join(', ') : 'Not set'}`,
    `Status: ${tailor.status ?? 'pending_review'}`,
    `Verification: ${tailor.verificationStatus ?? 'pending'}`,
    `Portfolio placeholders: ${portfolio.length}`,
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
