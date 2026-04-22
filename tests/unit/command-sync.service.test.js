import { beforeEach, describe, expect, it, vi } from 'vitest';

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
};

vi.mock('../../src/config/logger.js', () => ({
  logger,
}));

describe('command sync service', () => {
  beforeEach(() => {
    logger.info.mockReset();
    logger.warn.mockReset();
  });

  it('builds safe global and private Telegram command sets', async () => {
    const { getRegisteredBotCommandPlan } = await import(
      '../../src/bot/services/command-sync.service.js'
    );

    const plan = getRegisteredBotCommandPlan();

    expect(plan.global).toEqual([
      {
        command: 'start',
        description: 'open the Sewmaxx welcome menu and choose how you want to continue',
      },
      {
        command: 'help',
        description: 'see the commands available to you right now',
      },
    ]);

    expect(plan.private).toEqual([
      {
        command: 'start',
        description: 'open the Sewmaxx welcome menu and choose how you want to continue',
      },
      {
        command: 'help',
        description: 'see the commands available to you right now',
      },
    ]);
  });

  it('syncs Telegram commands without registering admin-only commands', async () => {
    const { syncBotCommands } = await import('../../src/bot/services/command-sync.service.js');
    const setMyCommands = vi.fn().mockResolvedValue(undefined);

    await syncBotCommands({
      telegram: {
        setMyCommands,
      },
    });

    expect(setMyCommands).toHaveBeenCalledTimes(2);
    expect(setMyCommands).toHaveBeenNthCalledWith(1, [
      {
        command: 'start',
        description: 'open the Sewmaxx welcome menu and choose how you want to continue',
      },
      {
        command: 'help',
        description: 'see the commands available to you right now',
      },
    ]);
    expect(setMyCommands).toHaveBeenNthCalledWith(
      2,
      [
        {
          command: 'start',
          description: 'open the Sewmaxx welcome menu and choose how you want to continue',
        },
        {
          command: 'help',
          description: 'see the commands available to you right now',
        },
      ],
      {
        scope: {
          type: 'all_private_chats',
        },
      },
    );

    const serializedCalls = JSON.stringify(setMyCommands.mock.calls);
    expect(serializedCalls).not.toContain('admin_tailors');
    expect(serializedCalls).not.toContain('search');
    expect(serializedCalls).not.toContain('requests');
    expect(serializedCalls).not.toContain('tailor_requests');
    expect(serializedCalls).not.toContain('client');
    expect(serializedCalls).not.toContain('tailor');
    expect(serializedCalls).not.toContain('affiliate');
  });

  it('does not block startup when Telegram command sync fails', async () => {
    const { syncBotCommands } = await import('../../src/bot/services/command-sync.service.js');
    const setMyCommands = vi.fn().mockRejectedValue(new Error('telegram unavailable'));

    await expect(
      syncBotCommands({
        telegram: {
          setMyCommands,
        },
      }),
    ).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalled();
  });
});
