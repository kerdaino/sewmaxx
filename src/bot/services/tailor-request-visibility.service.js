import mongoose from 'mongoose';
import { RequestPost } from '../../models/request-post.model.js';
import { TailorProfile } from '../../models/tailor-profile.model.js';
import { User } from '../../models/user.model.js';
import { logger } from '../../config/logger.js';
import { getBudgetCompatibilityScore } from '../../services/search.service.js';
import { ApiError } from '../../utils/api-error.js';
import { escapeRegExp } from '../../utils/escape-regexp.js';

export const REQUEST_BATCH_SIZE = 3;

const normalize = (value) => String(value ?? '').trim().toLowerCase();

const getTailorProfileByTelegramUserId = async (telegramUserId) => {
  const user = await User.findOne({ telegramUserId }).select('_id').lean();

  if (!user) {
    return {
      user: null,
      tailorProfile: null,
    };
  }

  const tailorProfile = await TailorProfile.findOne({ userId: user._id }).lean();

  return {
    user,
    tailorProfile,
  };
};

export const ensureTailorCanViewRequests = async (telegramUserId) => {
  const result = await getTailorProfileByTelegramUserId(telegramUserId);

  return {
    ...result,
    canView: Boolean(result.user && result.tailorProfile),
  };
};

export const calculateTailorRequestMatchScore = ({ request, tailor }) => {
  let score = 0;
  const requestCity = normalize(request.location?.city);
  const tailorCity = normalize(tailor.location?.city);
  const requestStyle = normalize(request.style || request.outfitType);
  const tailorCategories = [...(tailor.specialties ?? []), ...(tailor.styles ?? [])].map(normalize);

  if (requestCity && requestCity === tailorCity) {
    score += 5;
  }

  if (
    requestStyle &&
    tailorCategories.some(
      (category) => category.includes(requestStyle) || requestStyle.includes(category),
    )
  ) {
    score += 3;
  }

  score += getBudgetCompatibilityScore(tailor.budgetRange, request.budgetRange);

  return score;
};

export const buildTailorRequestSummary = (request, index) => {
  const styleLabel = request.style || request.outfitType;
  const range =
    request.budgetRange?.min !== null && request.budgetRange?.max !== null
      ? `${request.budgetRange.currency} ${request.budgetRange.min} - ${request.budgetRange.max}`
      : 'Budget on request';

  return [
    `${index}. ${styleLabel}`,
    `Request ID: ${request._id}`,
    `Location: ${request.location.city}, ${request.location.area || request.location.country}`,
    `Budget: ${range}`,
    `Due date: ${new Date(request.dueDate).toISOString().slice(0, 10)}`,
    `Status: ${request.status}`,
  ].join('\n');
};

export const getTailorRequestMatches = async ({ telegramUserId, page = 0 }) => {
  const { user, tailorProfile } = await getTailorProfileByTelegramUserId(telegramUserId);

  if (!user || !tailorProfile) {
    throw new ApiError(400, 'Tailor profile is required before viewing requests');
  }

  const safeCityPattern = new RegExp(`^${escapeRegExp(tailorProfile.location?.city ?? '')}$`, 'i');
  const activeRequestStatusFilter = mongoose.trusted({ $in: ['pending', 'reviewing', 'assigned'] });
  const futureDueDateFilter = mongoose.trusted({ $gt: new Date() });
  const requestQuery = {
    'location.city': safeCityPattern,
    status: activeRequestStatusFilter,
    dueDate: futureDueDateFilter,
  };

  const requests = await RequestPost.find(requestQuery)
    .select('outfitType style location budgetRange dueDate status createdAt')
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const matches = requests
    .map((request) => ({
      ...request,
      score: calculateTailorRequestMatchScore({ request, tailor: tailorProfile }),
    }))
    .filter((request) => request.score >= 8)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
    });

  logger.info(
    {
      event: 'tailor_request_visibility_executed',
      userId: user._id,
      tailorProfileId: tailorProfile._id,
      candidateCount: requests.length,
      matchCount: matches.length,
      page,
    },
    'Tailor request visibility executed',
  );

  const start = page * REQUEST_BATCH_SIZE;
  const end = start + REQUEST_BATCH_SIZE;

  return {
    tailorProfile,
    totalMatches: matches.length,
    page,
    items: matches.slice(start, end),
    hasMore: end < matches.length,
  };
};
