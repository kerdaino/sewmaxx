import { KNOWN_COMMANDS } from '../constants.js';

export const handleUnknownCommand = async (ctx) => {
  await ctx.reply(`Unknown command. Try one of: ${KNOWN_COMMANDS.join(', ')}`);
};
