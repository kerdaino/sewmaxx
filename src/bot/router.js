import { Composer } from 'telegraf';
import affiliateRouter from './domains/affiliate.router.js';
import onboardingRouter from './domains/onboarding.router.js';
import requestsRouter from './domains/requests.router.js';
import searchRouter from './domains/search.router.js';
import { handleHelpCommand } from './handlers/help.handler.js';
import { handleStartCommand, handleStartRoleSelection } from './handlers/start.handler.js';
import { handleUnknownCommand } from './handlers/unknown-command.handler.js';

export const createBotRouter = () => {
  const router = new Composer();

  router.command('start', handleStartCommand);
  router.command('help', handleHelpCommand);
  router.action(/^start:role:(client|tailor|affiliate)$/, handleStartRoleSelection);

  router.use(onboardingRouter);
  router.use(affiliateRouter);
  router.use(searchRouter);
  router.use(requestsRouter);

  router.on('message', async (ctx, next) => {
    if (typeof ctx.message?.text === 'string' && ctx.message.text.startsWith('/')) {
      await handleUnknownCommand(ctx);
      return;
    }

    await next();
  });

  router.on('message', async (ctx) => {
    await ctx.reply(
      'Message received. Use /help to see the supported Sewmaxx bot commands.',
    );
  });

  return router;
};
