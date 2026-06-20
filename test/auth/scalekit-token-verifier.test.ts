import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, generateKeyPair, type CryptoKey } from 'jose';
import { ScalekitTokenVerifier } from '../../src/auth/token-verifier.js';

const ISSUER = 'https://kinnectd.scalekit.dev/resources/res_test';
const AUDIENCE = 'https://dev.mcp.a2me.app';

describe('ScalekitTokenVerifier', () => {
  let privateKey: CryptoKey;
  let publicKey: CryptoKey;

  beforeAll(async () => {
    ({ privateKey, publicKey } = await generateKeyPair('RS256'));
  });

  const sign = (claims: Record<string, unknown>, opts: { aud?: string; expired?: boolean } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(ISSUER)
      .setAudience(opts.aud ?? AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(opts.expired ? '-1m' : '5m')
      .sign(privateKey);

  it('accepts a valid token and extracts scopes', async () => {
    const verifier = new ScalekitTokenVerifier(ISSUER, AUDIENCE, publicKey);
    const token = await sign({ scope: 'family:read profile:read' });
    const principal = await verifier.verify(token);
    expect(principal).toEqual({ token, scopes: ['family:read', 'profile:read'] });
  });

  it('rejects a token minted for a different audience', async () => {
    const verifier = new ScalekitTokenVerifier(ISSUER, AUDIENCE, publicKey);
    const token = await sign({ scope: 'family:read' }, { aud: 'https://evil.example' });
    expect(await verifier.verify(token)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const verifier = new ScalekitTokenVerifier(ISSUER, AUDIENCE, publicKey);
    const token = await sign({ scope: 'family:read' }, { expired: true });
    expect(await verifier.verify(token)).toBeNull();
  });

  it('rejects an empty / malformed token', async () => {
    const verifier = new ScalekitTokenVerifier(ISSUER, AUDIENCE, publicKey);
    expect(await verifier.verify('')).toBeNull();
    expect(await verifier.verify('not-a-jwt')).toBeNull();
  });
});
