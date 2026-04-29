import { beforeEach, describe, expect, it, vi } from 'vitest';

const ensureBotRoleAccess = vi.fn();
const ensureClientCanPostRequest = vi.fn();
const buildRequestDraftFromSearch = vi.fn();
const publishRequestPost = vi.fn();

vi.mock('../../src/bot/services/role-access.service.js', () => ({
  ensureBotRoleAccess,
}));

vi.mock('../../src/bot/services/request-flow.service.js', async () => {
  const actual = await vi.importActual('../../src/bot/services/request-flow.service.js');

  return {
    ...actual,
    buildRequestDraftFromSearch,
    ensureClientCanPostRequest,
    publishRequestPost,
  };
});

describe('request post handler', () => {
  beforeEach(() => {
    ensureBotRoleAccess.mockReset();
    ensureClientCanPostRequest.mockReset();
    buildRequestDraftFromSearch.mockReset();
    publishRequestPost.mockReset();
    ensureBotRoleAccess.mockResolvedValue(true);
  });

  it('starts the standalone /requests flow without seeded search details', async () => {
    const { startRequestPosting } = await import('../../src/bot/handlers/request-post.handler.js');
    ensureClientCanPostRequest.mockResolvedValue({
      canPost: true,
      clientProfile: {
        location: {
          country: 'Ghana',
        },
      },
    });

    const ctx = {
      from: { id: 123 },
      session: {},
      reply: vi.fn(),
    };

    await startRequestPosting(ctx);

    expect(ctx.session.requestFlow).toBe('client_request');
    expect(ctx.session.requestStep).toBe('request_outfit_type');
    expect(ctx.session.requestDraft).toEqual({ country: 'Ghana' });
    expect(ctx.reply).toHaveBeenCalledWith(
      'What outfit type would you like to request?',
      expect.any(Object),
    );
  });

  it('uses completed search details and asks only for due date when other request fields exist', async () => {
    const { startRequestPostingFromSearch } = await import('../../src/bot/handlers/request-post.handler.js');
    ensureClientCanPostRequest.mockResolvedValue({
      canPost: true,
      clientProfile: {
        location: {
          country: 'Kenya',
          area: 'Westlands',
        },
      },
    });
    buildRequestDraftFromSearch.mockReturnValue({
      outfitType: 'other',
      style: 'wedding dress',
      budgetRange: { min: 10000, max: 50000, currency: 'NGN' },
      country: 'Kenya',
      location: {
        country: 'Kenya',
        city: 'Nairobi',
        area: 'Westlands',
      },
    });

    const ctx = {
      from: { id: 123 },
      session: {
        searchDraft: {
          style: 'wedding dress',
          city: 'Nairobi',
          budgetRange: { min: 10000, max: 50000, currency: 'NGN' },
        },
      },
      reply: vi.fn(),
    };

    await startRequestPostingFromSearch(ctx);

    expect(ctx.session.requestFlow).toBe('client_request');
    expect(ctx.session.requestStep).toBe('request_due_date');
    expect(ctx.reply).toHaveBeenCalledWith('What is the due date? Use YYYY-MM-DD.');
  });

  it('skips already-seeded location after a missing budget is provided', async () => {
    const { handleRequestBudgetInput } = await import('../../src/bot/handlers/request-post.handler.js');
    const ctx = {
      from: { id: 123 },
      state: { sanitizedText: '10000-50000' },
      session: {
        requestFlow: 'client_request',
        requestStep: 'request_budget',
        requestDraft: {
          outfitType: 'other',
          style: 'agbada',
          location: {
            country: 'Ghana',
            city: 'Accra',
            area: 'Osu',
          },
        },
      },
      reply: vi.fn(),
    };

    await handleRequestBudgetInput(ctx);

    expect(ctx.session.requestStep).toBe('request_due_date');
    expect(ctx.reply).toHaveBeenCalledWith('What is the due date? Use YYYY-MM-DD.');
  });
});
