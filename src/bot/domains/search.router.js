import { Composer } from 'telegraf';
import {
  handleNextSearchPage,
  handleSearchBudgetInput,
  handleSearchLocationInput,
  handleSearchNextSteps,
  handleSearchStyleInput,
  restartClientSearch,
  startClientSearch,
} from '../handlers/search.handler.js';

const searchRouter = new Composer();

searchRouter.command('search', async (ctx) => {
  ctx.session.lastCommand = '/search';
  await startClientSearch(ctx);
});

searchRouter.action('search:restart', restartClientSearch);
searchRouter.action('search:page:next', handleNextSearchPage);
searchRouter.action('search:next:requests', handleSearchNextSteps);

searchRouter.on('text', async (ctx, next) => {
  if (ctx.session.searchFlow !== 'client_search') {
    await next();
    return;
  }

  if (ctx.session.searchStep === 'search_style') {
    await handleSearchStyleInput(ctx);
    return;
  }

  if (ctx.session.searchStep === 'search_location') {
    await handleSearchLocationInput(ctx);
    return;
  }

  if (ctx.session.searchStep === 'search_budget') {
    await handleSearchBudgetInput(ctx);
    return;
  }

  await next();
});

export default searchRouter;
