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

    expect(message).toContain('Sewmaxx commands');
    expect(message).toContain('General');
    expect(message).toContain('Client');
    expect(message).toContain('/search — find approved tailors by style, city, and budget');
    expect(message).toContain('/start — open the Sewmaxx welcome menu and choose how you want to continue');
    expect(message).not.toContain('/tailor — start or continue your tailor setup');
    expect(message).not.toContain('/affiliate — start or continue your affiliate setup');
    expect(message).not.toContain('Admin');
    expect(message).not.toContain('/onboarding');
    expect(message).not.toContain('/tailor_requests');
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

    expect(message).toContain('General');
    expect(message).toContain('Admin');
    expect(message).toContain('/admin_requests — review recent client requests');
    expect(message).toContain('/admin_tailor_detail <id> — open the private review record for one tailor');
    expect(message).toContain('/admin_affiliate_detail <id> — open the private review record for one affiliate');
    expect(message).not.toContain('/client — start or continue your client setup');
  });

  it('shows only getting-started commands for users without a role', async () => {
    const { buildRoleAwareHelpMessage } = await import(
      '../../src/bot/services/role-guidance.service.js'
    );

    const message = buildRoleAwareHelpMessage({
      profiles: {},
      selectedRole: null,
      telegramUserId: '123',
    });

    expect(message).toContain('General');
    expect(message).toContain('/start — open the Sewmaxx welcome menu and choose how you want to continue');
    expect(message).toContain('Client');
    expect(message).toContain('/client — start or continue your client setup');
    expect(message).toContain('Tailor');
    expect(message).toContain('/tailor — start or continue your tailor setup');
    expect(message).toContain('Affiliate');
    expect(message).toContain('/affiliate — start or continue your affiliate setup');
    expect(message).toContain('Choose the role that fits what you want to do');
    expect(message).not.toContain('/onboarding');
    expect(message).not.toContain('Admin');
  });
});
