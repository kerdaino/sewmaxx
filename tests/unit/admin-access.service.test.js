import { afterEach, describe, expect, it, vi } from 'vitest';

describe('admin access service', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows every configured admin id from supported env names', async () => {
    vi.resetModules();
    vi.stubEnv('ADMIN_TELEGRAM_IDS', '123456789,6461275346');
    vi.stubEnv('ADMIN_TELEGRAM_ID', '777777');
    vi.stubEnv('TELEGRAM_ADMIN_IDS', '999999');

    const { isTelegramAdmin } = await import('../../src/bot/services/admin-access.service.js');

    expect(isTelegramAdmin('123456789')).toBe(true);
    expect(isTelegramAdmin('6461275346')).toBe(true);
    expect(isTelegramAdmin('777777')).toBe(true);
    expect(isTelegramAdmin('999999')).toBe(true);
    expect(isTelegramAdmin('111111')).toBe(false);
  });

  it('supports multiple admin ids from ADMIN_TELEGRAM_IDS', async () => {
    vi.resetModules();
    vi.stubEnv('ADMIN_TELEGRAM_IDS', '123456789,6461275346');
    vi.stubEnv('ADMIN_TELEGRAM_ID', '');
    vi.stubEnv('TELEGRAM_ADMIN_IDS', '');

    const { isTelegramAdmin } = await import('../../src/bot/services/admin-access.service.js');

    expect(isTelegramAdmin('123456789')).toBe(true);
    expect(isTelegramAdmin('6461275346')).toBe(true);
    expect(isTelegramAdmin('6461275347')).toBe(false);
  });

  it('keeps backward compatibility with ADMIN_TELEGRAM_ID', async () => {
    vi.resetModules();
    vi.stubEnv('ADMIN_TELEGRAM_IDS', '');
    vi.stubEnv('ADMIN_TELEGRAM_ID', '777777');
    vi.stubEnv('TELEGRAM_ADMIN_IDS', '');

    const { isTelegramAdmin } = await import('../../src/bot/services/admin-access.service.js');

    expect(isTelegramAdmin('777777')).toBe(true);
    expect(isTelegramAdmin('123456789')).toBe(false);
  });
});
