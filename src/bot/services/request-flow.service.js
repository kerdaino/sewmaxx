import { ClientProfile } from '../../models/client-profile.model.js';
import { User } from '../../models/user.model.js';
import { createServiceRequest } from '../../services/request.service.js';

export const ensureClientCanPostRequest = async (telegramUserId) => {
  const user = await User.findOne({ telegramUserId }).select('_id').lean();

  if (!user) {
    return { canPost: false, user: null, clientProfile: null };
  }

  const clientProfile = await ClientProfile.findOne({ userId: user._id }).lean();

  return {
    canPost: Boolean(clientProfile),
    user,
    clientProfile,
  };
};

export const publishRequestPost = async ({
  telegramUserId,
  outfitType,
  style,
  budgetRange,
  location,
  dueDate,
}) =>
  createServiceRequest({
    clientTelegramUserId: telegramUserId,
    outfitType,
    style,
    notes: '',
    country: location.country,
    city: location.city,
    area: location.area,
    budgetMin: budgetRange.min,
    budgetMax: budgetRange.max,
    currency: budgetRange.currency,
    dueDate,
  });

export const buildRequestDraftFromSearch = ({ searchDraft = {}, clientProfile }) => ({
  outfitType: searchDraft.style ? 'other' : '',
  style: searchDraft.style ?? '',
  budgetRange: searchDraft.budgetRange ?? null,
  country: clientProfile?.location?.country ?? '',
  location:
    searchDraft.city && clientProfile?.location?.area
      ? {
          country: clientProfile.location.country,
          city: searchDraft.city,
          area: clientProfile.location.area,
        }
      : null,
});

export const buildRequestSummary = (draft) => {
  const outfitLabel = draft.outfitType === 'other' ? draft.style : draft.outfitType;

  return [
    'Request summary',
    '',
    `Outfit type: ${outfitLabel}`,
    `Budget: ${draft.budgetRange.currency} ${draft.budgetRange.min} - ${draft.budgetRange.max}`,
    `Location: ${draft.location.country}, ${draft.location.city}, ${draft.location.area}`,
    `Due date: ${draft.dueDateDisplay}`,
  ].join('\n');
};
