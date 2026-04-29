import {
  buildRequestOutfitTypeKeyboard,
  buildRequestRestartKeyboard,
  buildRequestSummaryKeyboard,
} from '../keyboards/request-post.keyboard.js';
import {
  buildRequestDraftFromSearch,
  buildRequestSummary,
  ensureClientCanPostRequest,
  publishRequestPost,
} from '../services/request-flow.service.js';
import {
  validateRequestBudget,
  validateRequestDueDate,
  validateRequestLocation,
  validateRequestOtherStyle,
} from '../validators/request-post.validator.js';
import { ensureBotRoleAccess } from '../services/role-access.service.js';
import { logger } from '../../config/logger.js';
import { serializeErrorForLog } from '../../utils/error-log.js';

const REQUEST_PUBLISH_DEDUPE_WINDOW_MS = 30 * 1000;

const resetRequestDraft = (ctx) => {
  ctx.session.activeDomain = 'requests';
  ctx.session.requestFlow = 'client_request';
  ctx.session.requestStep = 'request_outfit_type';
  ctx.session.requestDraft = {};
  ctx.session.requestPublishInFlight = false;
};

const getBudgetPrompt = () => 'Enter your budget range in your local currency, e.g. 10000-50000.';

const promptForNextMissingRequestField = async (ctx) => {
  const draft = ctx.session.requestDraft ?? {};

  if (!draft.outfitType || !draft.style) {
    ctx.session.requestStep = 'request_outfit_type';
    await ctx.reply('What outfit type would you like to request?', buildRequestOutfitTypeKeyboard());
    return;
  }

  if (!draft.budgetRange) {
    ctx.session.requestStep = 'request_budget';
    await ctx.reply(getBudgetPrompt());
    return;
  }

  if (!draft.location) {
    ctx.session.requestStep = 'request_location';
    await ctx.reply('What location should we use for this request? Example: Accra, Osu');
    return;
  }

  if (!draft.dueDate) {
    ctx.session.requestStep = 'request_due_date';
    await ctx.reply('What is the due date? Use YYYY-MM-DD.');
    return;
  }

  ctx.session.requestStep = 'request_confirm';
  await ctx.reply(buildRequestSummary(draft), buildRequestSummaryKeyboard());
};

const buildRequestPublishFingerprint = (draft) =>
  JSON.stringify({
    outfitType: draft.outfitType,
    style: draft.style,
    budgetRange: draft.budgetRange,
    location: draft.location,
    dueDate: draft.dueDate instanceof Date ? draft.dueDate.toISOString() : String(draft.dueDate ?? ''),
  });

export const startRequestPosting = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  const eligibility = await ensureClientCanPostRequest(telegramUserId);

  if (!eligibility.canPost) {
    await ctx.reply(
      'Request posting is available after client onboarding. Use /client to complete your profile first.',
      buildRequestRestartKeyboard(),
    );
    return;
  }

  resetRequestDraft(ctx);
  ctx.session.requestDraft = {
    country: eligibility.clientProfile.location.country,
  };
  await ctx.reply('What outfit type would you like to request?', buildRequestOutfitTypeKeyboard());
};

export const startRequestPostingFromSearch = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  const eligibility = await ensureClientCanPostRequest(telegramUserId);

  if (!eligibility.canPost) {
    await ctx.reply(
      'Request posting is available after client onboarding. Use /client to complete your profile first.',
      buildRequestRestartKeyboard(),
    );
    return;
  }

  resetRequestDraft(ctx);
  ctx.session.requestDraft = buildRequestDraftFromSearch({
    searchDraft: ctx.session.searchDraft ?? {},
    clientProfile: eligibility.clientProfile,
  });

  await promptForNextMissingRequestField(ctx);
};

export const restartRequestPosting = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client', { sendReplyMessage: !ctx.callbackQuery }))) {
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  const eligibility = await ensureClientCanPostRequest(telegramUserId);

  resetRequestDraft(ctx);
  ctx.session.requestDraft = {
    country: eligibility.clientProfile?.location.country ?? '',
  };

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Request flow restarted');
  }

  await ctx.reply('What outfit type would you like to request?', buildRequestOutfitTypeKeyboard());
};

export const handleRequestOutfitSelection = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client', { sendReplyMessage: false }))) {
    return;
  }

  if (ctx.session.requestFlow !== 'client_request') {
    await ctx.answerCbQuery('Start /requests first');
    return;
  }

  const outfitType = ctx.match?.[1];

  if (!outfitType) {
    await ctx.answerCbQuery('Invalid option');
    return;
  }

  ctx.session.requestDraft = {
    ...(ctx.session.requestDraft ?? {}),
    outfitType,
    style: outfitType === 'other' ? '' : outfitType,
  };
  ctx.session.requestStep = outfitType === 'other' ? 'request_other_style' : 'request_budget';

  await ctx.answerCbQuery();

  if (outfitType === 'other') {
    await ctx.reply('Please describe the outfit type or style you need.');
    return;
  }

  await promptForNextMissingRequestField(ctx);
};

export const handleRequestOtherStyleInput = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return true;
  }

  const result = validateRequestOtherStyle(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.requestDraft = {
    ...(ctx.session.requestDraft ?? {}),
    style: result.value,
  };
  await promptForNextMissingRequestField(ctx);
  return true;
};

export const handleRequestBudgetInput = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return true;
  }

  const result = validateRequestBudget(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.requestDraft = {
    ...(ctx.session.requestDraft ?? {}),
    budgetRange: result.value,
  };
  await promptForNextMissingRequestField(ctx);
  return true;
};

export const handleRequestLocationInput = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return true;
  }

  const result = validateRequestLocation(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  const [city = result.value, ...rest] = result.value.split(',');

  ctx.session.requestDraft = {
    ...(ctx.session.requestDraft ?? {}),
    location: {
      country: ctx.session.requestDraft?.country ?? '',
      city: city.trim(),
      area: rest.join(',').trim() || result.value,
    },
  };
  ctx.session.requestStep = 'request_due_date';

  await ctx.reply('What is the due date? Use YYYY-MM-DD.');
  return true;
};

export const handleRequestDueDateInput = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client'))) {
    return true;
  }

  const result = validateRequestDueDate(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.requestDraft = {
    ...(ctx.session.requestDraft ?? {}),
    dueDate: result.value,
    dueDateDisplay: result.displayValue,
  };
  ctx.session.requestStep = 'request_confirm';

  await ctx.reply(buildRequestSummary(ctx.session.requestDraft), buildRequestSummaryKeyboard());
  return true;
};

export const handleRequestEdit = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client', { sendReplyMessage: false }))) {
    return;
  }

  if (ctx.session.requestFlow !== 'client_request') {
    await ctx.answerCbQuery('Start /requests first');
    return;
  }

  const field = ctx.match?.[1];

  await ctx.answerCbQuery();

  if (field === 'outfit') {
    ctx.session.requestStep = 'request_outfit_type';
    await ctx.reply('Choose the outfit type again.', buildRequestOutfitTypeKeyboard());
    return;
  }

  if (field === 'budget') {
    ctx.session.requestStep = 'request_budget';
    await ctx.reply(getBudgetPrompt());
    return;
  }

  if (field === 'location') {
    ctx.session.requestStep = 'request_location';
    await ctx.reply('Enter the location again.');
    return;
  }

  if (field === 'due_date') {
    ctx.session.requestStep = 'request_due_date';
    await ctx.reply('Enter the due date again in YYYY-MM-DD format.');
  }
};

export const handleRequestPublish = async (ctx) => {
  if (!(await ensureBotRoleAccess(ctx, 'client', { sendReplyMessage: false }))) {
    return;
  }

  if (ctx.session.requestFlow !== 'client_request' || ctx.session.requestStep !== 'request_confirm') {
    await ctx.answerCbQuery('Complete /requests first');
    return;
  }

  const draft = ctx.session.requestDraft ?? {};
  const publishFingerprint = buildRequestPublishFingerprint(draft);

  if (!draft.outfitType || !draft.style || !draft.budgetRange || !draft.location || !draft.dueDate) {
    await ctx.answerCbQuery('Complete the summary first');
    await startRequestPosting(ctx);
    return;
  }

  if (ctx.session.requestPublishInFlight) {
    await ctx.answerCbQuery('This request is already being published');
    return;
  }

  if (
    ctx.session.lastPublishedRequestFingerprint === publishFingerprint &&
    typeof ctx.session.lastPublishedRequestAt === 'number' &&
    Date.now() - ctx.session.lastPublishedRequestAt < REQUEST_PUBLISH_DEDUPE_WINDOW_MS
  ) {
    await ctx.answerCbQuery('This request was already submitted');
    return;
  }

  ctx.session.requestPublishInFlight = true;
  await ctx.answerCbQuery();

  let request;

  try {
    request = await publishRequestPost({
      telegramUserId: String(ctx.from?.id ?? ''),
      outfitType: draft.outfitType,
      style: draft.style,
      budgetRange: draft.budgetRange,
      location: draft.location,
      dueDate: draft.dueDate,
    });
  } catch (error) {
    logger.error(
      {
        event: 'request_publish_failed',
        error: serializeErrorForLog(error),
        updateType: ctx.updateType,
        outfitType: draft.outfitType,
      },
      'Request publishing failed',
    );
    await ctx.reply('We could not publish this request right now. Please try again shortly.');
    ctx.session.requestPublishInFlight = false;
    return;
  }

  ctx.session.lastPublishedRequestFingerprint = publishFingerprint;
  ctx.session.lastPublishedRequestAt = Date.now();
  ctx.session.requestPublishInFlight = false;
  ctx.session.requestFlow = null;
  ctx.session.requestStep = null;
  ctx.session.requestDraft = null;

  await ctx.reply(
    `Your request has been published.\n\nRequest ID: ${request.id}\nStatus: ${request.status}\nDue date: ${draft.dueDateDisplay}`,
    buildRequestRestartKeyboard(),
  );
};
