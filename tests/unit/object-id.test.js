import { describe, expect, it } from 'vitest';
import { ApiError } from '../../src/utils/api-error.js';
import { assertValidObjectId, isValidObjectId } from '../../src/utils/object-id.js';

describe('object id utilities', () => {
  it('accepts valid MongoDB object ids', () => {
    const value = '507f1f77bcf86cd799439011';

    expect(isValidObjectId(value)).toBe(true);
    expect(assertValidObjectId(value, 'Tailor id')).toBe(value);
  });

  it('rejects malformed MongoDB object ids', () => {
    expect(isValidObjectId('not-an-id')).toBe(false);

    expect(() => assertValidObjectId('not-an-id', 'Request id')).toThrow(ApiError);
    expect(() => assertValidObjectId('not-an-id', 'Request id')).toThrow('Request id is invalid');
  });
});
