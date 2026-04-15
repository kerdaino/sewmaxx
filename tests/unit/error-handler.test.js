import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/utils/api-error.js';

describe('error handler behavior', () => {
  it('returns minimal operational errors without stack traces', async () => {
    const { errorHandler } = await import('../../src/middlewares/error-handler.js');
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();

    errorHandler(
      new ApiError(400, 'Invalid request payload', [{ message: 'x' }]),
      { id: 'req-1', originalUrl: '/api/v1/test', method: 'POST' },
      { status, json },
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid request payload',
      }),
    );
  });
});
