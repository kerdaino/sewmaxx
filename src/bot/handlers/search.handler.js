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
} from '../services/search-flow.service.js';
import {
  validateSearchBudget,
  validateSearchLocation,
  validateSearchStyle,
} from '../validators/search.validator.js';

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
  resetSearchDraft(ctx);

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Search restarted');
  }

  await ctx.reply('Search restarted. What outfit type or style do you need?');
};

export const handleSearchStyleInput = async (ctx) => {
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

  await ctx.reply('Which city should we search in?');
  return true;
};

export const handleSearchLocationInput = async (ctx) => {
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

  await ctx.reply('What budget range should we use? Example: 10000-50000');
  return true;
};

export const handleSearchBudgetInput = async (ctx) => {
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
  if (!ctx.session.searchResults?.matches?.length) {
    await ctx.answerCbQuery('No more results');
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
  await ctx.answerCbQuery();
  await ctx.reply('No tailor matched yet. You can try another search now, and request posting can be added next.');
};

const finalizeSearch = async (ctx) => {
  const draft = ctx.session.searchDraft ?? {};

  if (!draft.style || !draft.city || !draft.budgetRange) {
    await startClientSearch(ctx);
    return;
  }

  const { searchSession, matches } = await createSearchSession({
    telegramUserId: String(ctx.from?.id ?? ''),
    style: draft.style,
    city: draft.city,
    budgetRange: draft.budgetRange,
  });

  ctx.session.searchResults = {
    searchSessionId: String(searchSession._id),
    matches,
  };
  ctx.session.searchStep = null;
  ctx.session.searchPage = 0;

  if (matches.length === 0) {
    await ctx.reply(
      'No matching tailors were found for this search yet. You can try a broader style, another city, or post a request next.',
      buildSearchEmptyResultsKeyboard(),
    );
    return;
  }

  const batch = getMatchBatch(matches, 0);
  await sendSearchBatch(ctx, batch, matches.length);
};

const sendSearchBatch = async (ctx, batch, totalMatches) => {
  const summary = batch.items
    .map((tailor, index) => buildTailorResultSummary(tailor, batch.page * 3 + index + 1))
    .join('\n\n');

  await ctx.reply(
    `Found ${totalMatches} matching tailors.\n\n${summary}`,
    buildSearchResultsKeyboard({ hasMore: batch.hasMore }),
  );
};
