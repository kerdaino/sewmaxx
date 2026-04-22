export const handleUnknownCommand = async (ctx) => {
  await ctx.reply('Unknown command. Use /help to see the commands available for your role.');
};
