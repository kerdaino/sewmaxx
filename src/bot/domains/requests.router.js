import { Composer } from 'telegraf';
import {
  handleRequestBudgetInput,
  handleRequestDueDateInput,
  handleRequestEdit,
  handleRequestLocationInput,
  handleRequestOtherStyleInput,
  handleRequestOutfitSelection,
  handleRequestPublish,
  restartRequestPosting,
  startRequestPosting,
} from '../handlers/request-post.handler.js';

const requestsRouter = new Composer();

requestsRouter.command('requests', async (ctx) => {
  ctx.session.lastCommand = '/requests';
  await startRequestPosting(ctx);
});

requestsRouter.action(/^request:outfit:(agbada|dress|senator|shirt|trouser|wedding|uniform|other)$/, handleRequestOutfitSelection);
requestsRouter.action(/^request:edit:(outfit|budget|location|due_date)$/, handleRequestEdit);
requestsRouter.action('request:publish', handleRequestPublish);
requestsRouter.action('request:restart', restartRequestPosting);

requestsRouter.on('text', async (ctx, next) => {
  if (ctx.session.requestFlow !== 'client_request') {
    await next();
    return;
  }

  if (ctx.session.requestStep === 'request_other_style') {
    await handleRequestOtherStyleInput(ctx);
    return;
  }

  if (ctx.session.requestStep === 'request_budget') {
    await handleRequestBudgetInput(ctx);
    return;
  }

  if (ctx.session.requestStep === 'request_location') {
    await handleRequestLocationInput(ctx);
    return;
  }

  if (ctx.session.requestStep === 'request_due_date') {
    await handleRequestDueDateInput(ctx);
    return;
  }

  await next();
});

export default requestsRouter;
