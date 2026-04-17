import {
  buildTailorRequestControlsKeyboard,
  buildTailorRequestEmptyKeyboard,
} from '../keyboards/tailor-request.keyboard.js';
import {
  buildTailorRequestSummary,
  ensureTailorCanViewRequests,
  getTailorRequestMatches,
} from '../services/tailor-request-visibility.service.js';
import { logger } from '../../config/logger.js';
import { serializeErrorForLog } from '../../utils/error-log.js';

const resetTailorRequestState = (ctx) => {
  ctx.session.activeDomain = 'requests';
  ctx.session.requestFlow = null;
  ctx.session.requestStep = null;
  ctx.session.requestDraft = null;
  ctx.session.tailorRequestPage = 0;
};

export const startTailorRequestView = async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  const eligibility = await ensureTailorCanViewRequests(telegramUserId);

  if (!eligibility.canView) {
    await ctx.reply(
      'Tailor request visibility is available after tailor onboarding. Use /tailor to complete your profile first.',
      buildTailorRequestEmptyKeyboard(),
    );
    return;
  }

  resetTailorRequestState(ctx);
  await sendTailorRequestPage(ctx, 0);
};

export const restartTailorRequestView = async (ctx) => {
  resetTailorRequestState(ctx);

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Requests refreshed');
  }

  await sendTailorRequestPage(ctx, 0);
};

export const handleNextTailorRequestPage = async (ctx) => {
  const nextPage = Number(ctx.session.tailorRequestPage ?? 0) + 1;

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery();
  }

  await sendTailorRequestPage(ctx, nextPage);
};

const sendTailorRequestPage = async (ctx, page) => {
  try {
    const result = await getTailorRequestMatches({
      telegramUserId: String(ctx.from?.id ?? ''),
      page,
    });

    if (result.items.length === 0) {
      ctx.session.tailorRequestPage = 0;

      await ctx.reply(
        page === 0
          ? 'No matching client requests are available for your city and specialties right now.'
          : 'No more matching requests are available right now.',
        buildTailorRequestEmptyKeyboard(),
      );
      return;
    }

    ctx.session.tailorRequestPage = result.page;

    const summary = result.items
      .map((request, index) =>
        buildTailorRequestSummary(request, result.page * 3 + index + 1),
      )
      .join('\n\n');

    await ctx.reply(
      `Found ${result.totalMatches} relevant client requests.\n\n${summary}`,
      buildTailorRequestControlsKeyboard({ hasMore: result.hasMore }),
    );
  } catch (error) {
    logger.error(
      {
        event: 'tailor_request_view_failed',
        error: serializeErrorForLog(error),
        updateType: ctx.updateType,
      },
      'Tailor request visibility failed',
    );
    await ctx.reply('We could not load matching requests right now. Please try again shortly.');
  }
};
