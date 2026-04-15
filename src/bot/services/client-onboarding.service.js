import { ClientProfile } from '../../models/client-profile.model.js';
import { User } from '../../models/user.model.js';
import { onboardClient } from '../../services/onboarding.service.js';

export const getExistingClientProfile = async (telegramUserId) => {
  const user = await User.findOne({ telegramUserId }).select('_id').lean();

  if (!user) {
    return null;
  }

  return ClientProfile.findOne({ userId: user._id }).lean();
};

export const completeClientOnboarding = async ({
  telegramUserId,
  telegramUsername,
  fullName,
  country,
  city,
  area,
  referralCode,
}) =>
  onboardClient({
    telegramUserId,
    telegramUsername,
    fullName,
    country,
    city,
    area,
    referralCode,
  });

export const buildClientSummary = ({ client, usedReferral }) => {
  const summaryLines = [
    'Client onboarding complete.',
    '',
    `Full name: ${client.fullName}`,
    `Country: ${client.location.country}`,
    `City: ${client.location.city}`,
    `Area: ${client.location.area}`,
  ];

  if (usedReferral) {
    summaryLines.push('Referral: linked successfully');
  }

  return summaryLines.join('\n');
};
