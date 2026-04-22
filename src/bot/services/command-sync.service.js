import { logger } from '../../config/logger.js';
import { REGISTERED_BOT_COMMAND_SETS, VISIBLE_BOT_COMMANDS } from '../constants.js';

const GENERAL_COMMAND_LOOKUP = new Map(
  VISIBLE_BOT_COMMANDS.general.map((entry) => [entry.command, entry.description]),
);

const toTelegramCommand = (command) => command.replace(/^\//, '').trim();

const buildTelegramCommands = (commands) =>
  commands.map((command) => ({
    command: toTelegramCommand(command),
    description: GENERAL_COMMAND_LOOKUP.get(command) ?? 'Sewmaxx bot command',
  }));

export const getRegisteredBotCommandPlan = () => ({
  global: buildTelegramCommands(REGISTERED_BOT_COMMAND_SETS.global),
  private: buildTelegramCommands(REGISTERED_BOT_COMMAND_SETS.private),
});

export const syncBotCommands = async (bot) => {
  if (!bot?.telegram?.setMyCommands) {
    logger.warn({ event: 'telegram_command_sync_skipped' }, 'Telegram command sync skipped: bot client unavailable');
    return;
  }

  const plan = getRegisteredBotCommandPlan();

  try {
    await bot.telegram.setMyCommands(plan.global);
    await bot.telegram.setMyCommands(plan.private, {
      scope: {
        type: 'all_private_chats',
      },
    });

    logger.info(
      {
        event: 'telegram_command_sync_complete',
        globalCommands: plan.global.map(({ command }) => command),
        privateCommands: plan.private.map(({ command }) => command),
      },
      'Telegram bot commands synced',
    );
  } catch (error) {
    logger.warn(
      {
        err: error,
        event: 'telegram_command_sync_failed',
      },
      'Telegram bot command sync failed; continuing startup without blocking the bot',
    );
  }
};
