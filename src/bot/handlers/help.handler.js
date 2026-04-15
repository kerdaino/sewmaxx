export const handleHelpCommand = async (ctx) => {
  ctx.session.lastCommand = '/help';

  await ctx.reply(
    'Available commands: /start, /onboarding, /client, /tailor, /affiliate, /search, /requests, /help',
  );
};
