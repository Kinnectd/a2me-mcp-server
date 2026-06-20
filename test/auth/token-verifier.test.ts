import { describe, it, expect } from 'vitest';
import { DevTokenVerifier } from '../../src/auth/token-verifier.js';

// ScalekitTokenVerifier has its own suite in scalekit-token-verifier.test.ts.
describe('DevTokenVerifier', () => {
  const verifier = new DevTokenVerifier();

  it('accepts a non-empty bearer and forwards it with family:read', async () => {
    const principal = await verifier.verify('some-firebase-token');
    expect(principal).toEqual({ token: 'some-firebase-token', scopes: ['family:read'] });
  });

  it('rejects an empty token', async () => {
    expect(await verifier.verify('')).toBeNull();
  });
});
