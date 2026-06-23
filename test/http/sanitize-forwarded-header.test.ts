import { describe, it, expect } from 'vitest';
import { sanitizeForwardedHeader } from '../../src/http/http-server.js';

describe('sanitizeForwardedHeader', () => {
  it('returns undefined for empty/undefined input', () => {
    expect(sanitizeForwardedHeader(undefined, 256)).toBeUndefined();
    expect(sanitizeForwardedHeader('', 256)).toBeUndefined();
    expect(sanitizeForwardedHeader('   ', 256)).toBeUndefined();
  });

  it('passes a clean value through unchanged', () => {
    expect(sanitizeForwardedHeader('claude-ai/1.2.3', 256)).toBe('claude-ai/1.2.3');
  });

  it('strips C0 control characters and DEL (header-injection / fetch validation)', () => {
    const raw = `claude${String.fromCharCode(13)}${String.fromCharCode(10)}-ai${String.fromCharCode(0)}${String.fromCharCode(127)}`;
    expect(sanitizeForwardedHeader(raw, 256)).toBe('claude-ai');
  });

  it('caps length', () => {
    expect(sanitizeForwardedHeader('x'.repeat(500), 256)).toHaveLength(256);
  });

  it('returns undefined when only control chars remain', () => {
    const raw = `${String.fromCharCode(0)}${String.fromCharCode(127)}`;
    expect(sanitizeForwardedHeader(raw, 256)).toBeUndefined();
  });
});
