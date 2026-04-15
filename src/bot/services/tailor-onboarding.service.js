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
  businessName,
  publicName,
  country,
  city,
  area,
  workAddress,
  specialties,
  budgetRange,
}) =>
  onboardTailor({
    telegramUserId,
    telegramUsername,
    fullName,
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

export const buildTailorSummary = ({ tailor }) => {
  const summaryLines = [
    'Tailor onboarding complete.',
    '',
    `Full name: ${tailor.fullName}`,
    `Business name: ${tailor.businessName}`,
    `Public name: ${tailor.publicName}`,
    `Country: ${tailor.location.country}`,
    `City: ${tailor.location.city}`,
    `Work address: ${tailor.workAddress}`,
    `Specialties: ${tailor.specialties.join(', ')}`,
    `Status: ${tailor.status}`,
    `Verification: ${tailor.verificationStatus}`,
    `Portfolio placeholders: ${tailor.portfolio.length}`,
  ];

  if (tailor.budgetRange?.min !== null && tailor.budgetRange?.max !== null) {
    summaryLines.push(
      `Service range: ${tailor.budgetRange.currency} ${tailor.budgetRange.min} - ${tailor.budgetRange.max}`,
    );
  } else {
    summaryLines.push('Service range: not set');
  }

  return summaryLines.join('\n');
};
