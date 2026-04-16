import {
  buildRequestOutfitTypeKeyboard,
  buildRequestRestartKeyboard,
  buildRequestSummaryKeyboard,
} from '../keyboards/request-post.keyboard.js';
import { buildRequestSummary, ensureClientCanPostRequest, publishRequestPost } from '../services/request-flow.service.js';
import {
  validateRequestBudget,
  validateRequestDueDate,
  validateRequestLocation,
  validateRequestOtherStyle,
} from '../validators/request-post.validator.js';
import { logger } from '../../config/logger.js';
import { serializeErrorForLog } from '../../utils/error-log.js';

const resetRequestDraft = (ctx) => {
  ctx.session.activeDomain = 'requests';
  ctx.session.requestFlow = 'client_request';
  ctx.session.requestStep = 'request_outfit_type';
  ctx.session.requestDraft = {};
};

export const startRequestPosting = async (ctx) => {
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

export const restartRequestPosting = async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  const eligibility = await ensureClientCanPostRequest(telegramUserId);

  resetRequestDraft(ctx);
  ctx.session.requestDraft = {
    country: eligibility.clientProfile?.location.country ?? 'Nigeria',
  };

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Request flow restarted');
  }

  await ctx.reply('What outfit type would you like to request?', buildRequestOutfitTypeKeyboard());
};

export const handleRequestOutfitSelection = async (ctx) => {
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

  await ctx.reply('What budget range should we use? Example: 10000-50000');
};

export const handleRequestOtherStyleInput = async (ctx) => {
  const result = validateRequestOtherStyle(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.requestDraft = {
    ...(ctx.session.requestDraft ?? {}),
    style: result.value,
  };
  ctx.session.requestStep = 'request_budget';

  await ctx.reply('What budget range should we use? Example: 10000-50000');
  return true;
};

export const handleRequestBudgetInput = async (ctx) => {
  const result = validateRequestBudget(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.requestDraft = {
    ...(ctx.session.requestDraft ?? {}),
    budgetRange: result.value,
  };
  ctx.session.requestStep = 'request_location';

  logger.info(
    {
      event: 'request_budget_captured',
      updateType: ctx.updateType,
      min: result.value.min,
      max: result.value.max,
    },
    'Captured request posting budget range',
  );

  await ctx.reply('What location should we use for this request?');
  return true;
};

export const handleRequestLocationInput = async (ctx) => {
  const result = validateRequestLocation(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  const [city = result.value, ...rest] = result.value.split(',');

  ctx.session.requestDraft = {
    ...(ctx.session.requestDraft ?? {}),
    location: {
      country: ctx.session.requestDraft?.country ?? 'Nigeria',
      city: city.trim(),
      area: rest.join(',').trim() || result.value,
    },
  };
  ctx.session.requestStep = 'request_due_date';

  await ctx.reply('What is the due date? Use YYYY-MM-DD.');
  return true;
};

export const handleRequestDueDateInput = async (ctx) => {
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
  const field = ctx.match?.[1];

  await ctx.answerCbQuery();

  if (field === 'outfit') {
    ctx.session.requestStep = 'request_outfit_type';
    await ctx.reply('Choose the outfit type again.', buildRequestOutfitTypeKeyboard());
    return;
  }

  if (field === 'budget') {
    ctx.session.requestStep = 'request_budget';
    await ctx.reply('Enter the budget again. Example: 10000-50000');
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
  const draft = ctx.session.requestDraft ?? {};

  if (!draft.outfitType || !draft.style || !draft.budgetRange || !draft.location || !draft.dueDate) {
    await ctx.answerCbQuery('Complete the summary first');
    await startRequestPosting(ctx);
    return;
  }

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
      },
      'Request publishing failed',
    );
    await ctx.reply('We could not publish this request right now. Please try again shortly.');
    return;
  }

  ctx.session.requestFlow = null;
  ctx.session.requestStep = null;
  ctx.session.requestDraft = null;

  await ctx.reply(
    `Your request has been published.\n\nRequest ID: ${request.id}\nStatus: ${request.status}\nDue date: ${draft.dueDateDisplay}`,
    buildRequestRestartKeyboard(),
  );
};
