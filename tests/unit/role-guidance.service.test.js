import { beforeEach, describe, expect, it, vi } from 'vitest';

const isTelegramAdmin = vi.fn();

vi.mock('../../src/bot/services/admin-access.service.js', () => ({
  isTelegramAdmin,
}));

describe('role guidance service', () => {
  beforeEach(() => {
    isTelegramAdmin.mockReset();
    isTelegramAdmin.mockReturnValue(false);
  });

  it('shows client help without admin commands for non-admin users', async () => {
    const { buildRoleAwareHelpMessage } = await import(
      '../../src/bot/services/role-guidance.service.js'
    );

    const message = buildRoleAwareHelpMessage({
      profiles: {
        clientProfile: { _id: 'client-1' },
      },
      selectedRole: 'client',
      telegramUserId: '123',
    });

    expect(message).toContain('You are using Sewmaxx as a client.');
    expect(message).toContain('/search - find approved tailors by style, city, and budget');
    expect(message).not.toContain('Admin commands:');
  });

  it('shows admin commands only to admins', async () => {
    const { buildRoleAwareHelpMessage } = await import(
      '../../src/bot/services/role-guidance.service.js'
    );

    isTelegramAdmin.mockReturnValue(true);

    const message = buildRoleAwareHelpMessage({
      profiles: {},
      selectedRole: null,
      telegramUserId: '999',
    });

    expect(message).toContain('You are using Sewmaxx as an admin.');
    expect(message).toContain('Admin commands:');
    expect(message).toContain('/admin_requests - list recent client requests');
  });
});
