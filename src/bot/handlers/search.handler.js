import {
  buildSearchControlsKeyboard,
  buildSearchEmptyResultsKeyboard,
  buildSearchResultsKeyboard,
} from '../keyboards/search.keyboard.js';
import {
  buildTailorResultSummary,
  createSearchSession,
  ensureClientCanSearch,
  getMatchBatch,
  SEARCH_BATCH_SIZE,
} from '../services/search-flow.service.js';
import { startRequestPostingFromSearch } from './request-post.handler.js';
import {
  validateSearchBudget,
  validateSearchLocation,
  validateSearchStyle,
} from '../validators/search.validator.js';
import { ensureBotRoleAccess } from '../services/role-access.service.js';
import { logger } from '../../config/logger.js';
import { serializeErrorForLog } from '../../utils/error-log.js';

const resetSearchDraft = (ctx) => {
  ctx.session.activeDomain = 'search';
  ctx.session.onboardingFlow = null;
  ctx.session.onboardingStep = null;
  ctx.session.searchFlow = 'client_search';
  ctx.session.searchStep = 'search_style';
  ctx.session.searchDraft = {};
  ctx.session.searchResults = null;
  ctx.session.searchPage = 0;
};

export const startClientSearch = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  const eligibility = await ensureClientCanSearch(telegramUserId);

  if (!eligibility.canSearch) {
    await ctx.reply(
      'Client search is available after client onboarding. Use /client to complete your profile first.',
      buildSearchControlsKeyboard(),
    );
    return;
  }

  resetSearchDraft(ctx);
  await ctx.reply('What outfit type or style do you need?');
};

export const restartClientSearch = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client', { sendReplyMessage: !ctx.callbackQuery }))) {
    return;
  }

  resetSearchDraft(ctx);

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Search restarted');
  }

  await ctx.reply('Search restarted. What outfit type or style do you need?');
};

export const handleSearchStyleInput = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return true;
  }

  const result = validateSearchStyle(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.searchDraft = {
    ...(ctx.session.searchDraft ?? {}),
    style: result.value,
  };
  ctx.session.searchStep = 'search_location';

  await ctx.reply('Which city should we search in? Examples: Lagos, Accra, Nairobi');
  return true;
};

export const handleSearchLocationInput = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return true;
  }

  const result = validateSearchLocation(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.searchDraft = {
    ...(ctx.session.searchDraft ?? {}),
    city: result.value,
  };
  ctx.session.searchStep = 'search_budget';

  await ctx.reply('Enter your budget range in your local currency, e.g. 10000-50000.');
  return true;
};

export const handleSearchBudgetInput = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return true;
  }

  const result = validateSearchBudget(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.searchDraft = {
    ...(ctx.session.searchDraft ?? {}),
    budgetRange: result.value,
  };

  await finalizeSearch(ctx);
  return true;
};

export const handleNextSearchPage = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client', { sendReplyMessage: false }))) {
    return;
  }

  if (!ctx.session.searchResults?.matches?.length) {
    await ctx.answerCbQuery('Start /search first');
    return;
  }

  ctx.session.searchPage = Number(ctx.session.searchPage ?? 0) + 1;
  const batch = getMatchBatch(ctx.session.searchResults.matches, ctx.session.searchPage);

  if (batch.items.length === 0) {
    await ctx.answerCbQuery('No more results');
    return;
  }

  await ctx.answerCbQuery();
  await sendSearchBatch(ctx, batch, ctx.session.searchResults.matches.length);
};

export const handleSearchNextSteps = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client', { sendReplyMessage: false }))) {
    return;
  }

  await ctx.answerCbQuery();
  await ctx.reply(
    'You can publish a request from this search. I will reuse the details you already entered and ask only for anything missing.',
  );
  await startRequestPostingFromSearch(ctx);
};

const finalizeSearch = async (ctx) => {
  const draft = ctx.session.searchDraft ?? {};

  if (!draft.style || !draft.city || !draft.budgetRange) {
    await startClientSearch(ctx);
    return;
  }

  let searchResult;

  try {
    searchResult = await createSearchSession({
      telegramUserId: String(ctx.from?.id ?? ''),
      style: draft.style,
      city: draft.city,
      budgetRange: draft.budgetRange,
    });
  } catch (error) {
    logger.error(
      {
        event: 'client_search_finalize_failed',
        error: serializeErrorForLog(error),
        updateType: ctx.updateType,
      },
      'Client search finalization failed',
    );
    await ctx.reply('We could not complete this search right now. Please try again shortly.');
    return;
  }

  const { searchSession, matches } = searchResult;

  ctx.session.searchResults = {
    searchSessionId: String(searchSession._id),
    matches,
  };
  ctx.session.searchStep = null;
  ctx.session.searchPage = 0;

  if (matches.length === 0) {
    await ctx.reply(
      'No approved tailors matched this search yet. You can try another search or post a request so Sewmaxx coordinators can handle the matching manually.',
      buildSearchEmptyResultsKeyboard(),
    );
    return;
  }

  const batch = getMatchBatch(matches, 0);
  await sendSearchBatch(ctx, batch, matches.length);
};

const sendSearchBatch = async (ctx, batch, totalMatches) => {
  const summary = batch.items
    .map((tailor, index) =>
      buildTailorResultSummary(tailor, batch.page * SEARCH_BATCH_SIZE + index + 1),
    )
    .join('\n\n');

  await ctx.reply(
    `Found ${totalMatches} matching tailors.\n\n${summary}\n\nYou can keep browsing results or post a request if you want Sewmaxx coordinators to take over the next step.`,
    buildSearchResultsKeyboard({ hasMore: batch.hasMore }),
  );
};
