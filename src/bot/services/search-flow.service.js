import { ClientProfile } from '../../models/client-profile.model.js';
import { SearchSession } from '../../models/search-session.model.js';
import { User } from '../../models/user.model.js';
import { logger } from '../../config/logger.js';
import { searchTailors } from '../../services/search.service.js';
import { ApiError } from '../../utils/api-error.js';

const SEARCH_BATCH_SIZE = 3;

const getUserAndClientProfile = async (telegramUserId) => {
  const user = await User.findOne({ telegramUserId }).select('_id').lean();

  if (!user) {
    return {
      user: null,
      clientProfile: null,
    };
  }

  const clientProfile = await ClientProfile.findOne({ userId: user._id }).lean();

  return {
    user,
    clientProfile,
  };
};

export const ensureClientCanSearch = async (telegramUserId) => {
  const result = await getUserAndClientProfile(telegramUserId);

  return {
    ...result,
    canSearch: Boolean(result.user && result.clientProfile),
  };
};

export const createSearchSession = async ({ telegramUserId, style, city, budgetRange }) => {
  const { user, clientProfile } = await getUserAndClientProfile(telegramUserId);

  if (!user || !clientProfile) {
    throw new ApiError(400, 'Client profile is required before searching');
  }

  const matches = await searchTailors({
    city,
    specialty: style,
    limit: 30,
    budgetRange,
  });

  const searchSession = await SearchSession.create({
    userId: user._id,
    clientProfileId: clientProfile._id,
    style,
    location: {
      city,
      country: clientProfile.location.country,
      area: clientProfile.location.area,
      state: clientProfile.location.state ?? '',
    },
    budgetRange,
    matchedTailorIds: matches.map((match) => match._id),
    matchedTailorCount: matches.length,
    status: matches.length > 0 ? 'completed' : 'active',
  });

  logger.info(
    {
      event: 'tailor_matching_completed',
      searchSessionId: searchSession._id,
      matchCount: matches.length,
      matchedTailorIds: matches.map((match) => String(match._id)),
    },
    'Tailor matching completed',
  );

  return {
    searchSession,
    matches,
  };
};

export const buildTailorResultSummary = (tailor, index) => {
  const range =
    tailor.budgetRange?.min !== null && tailor.budgetRange?.max !== null
      ? `${tailor.budgetRange.currency} ${tailor.budgetRange.min} - ${tailor.budgetRange.max}`
      : 'Range on request';

  return [
    `${index}. ${tailor.publicName}`,
    `Business: ${tailor.businessName}`,
    `City: ${tailor.location.city}`,
    `Specialties: ${tailor.specialties.slice(0, 4).join(', ')}`,
    `Service range: ${range}`,
    `Verification: ${tailor.verificationStatus}`,
  ].join('\n');
};

export const getMatchBatch = (matches, page) => {
  const start = page * SEARCH_BATCH_SIZE;
  const end = start + SEARCH_BATCH_SIZE;

  return {
    items: matches.slice(start, end),
    hasMore: end < matches.length,
    page,
  };
};
