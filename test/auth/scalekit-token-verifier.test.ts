import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { SignJWT, generateKeyPair, exportJWK, type CryptoKey } from 'jose';
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

  // Regression: Scalekit stamps `iss` inconsistently — its resource metadata has advertised both
  // the tenant base origin AND the per-resource URL over time, and tokens minted for some clients
  // (observed: ChatGPT's DCR flow) carry the base origin regardless of what the metadata declares.
  // The verifier accepts any of {metadata issuer, discovery URL, discovery origin}: all the same
  // trust root (signature = tenant JWKS, audience pins the resource).
  describe('issuer from AS metadata (discovery path)', () => {
    const DISCOVERY_URL = 'https://kinnectd.scalekit.dev/resources/res_test';
    const DECLARED_ISSUER = 'https://kinnectd.scalekit.dev';
    const JWKS_URI = 'https://kinnectd.scalekit.dev/keys';

    afterEach(() => vi.unstubAllGlobals());

    const stubDiscovery = async () => {
      const jwk = { ...(await exportJWK(publicKey)), kid: 'test', alg: 'RS256' };
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string | URL) => {
          const u = String(url);
          if (u.endsWith('/.well-known/oauth-authorization-server')) {
            return new Response(JSON.stringify({ issuer: DECLARED_ISSUER, jwks_uri: JWKS_URI }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }
          if (u === JWKS_URI) {
            return new Response(JSON.stringify({ keys: [jwk] }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }
          throw new Error(`unexpected fetch: ${u}`);
        }),
      );
    };

    const signWith = (issuer: string) =>
      new SignJWT({ scope: 'family:read' })
        .setProtectedHeader({ alg: 'RS256', kid: 'test' })
        .setIssuer(issuer)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey);

    it('accepts a token whose iss is the metadata issuer, not the discovery URL', async () => {
      await stubDiscovery();
      const verifier = new ScalekitTokenVerifier(DISCOVERY_URL, AUDIENCE); // no injected keys → discovers
      const token = await signWith(DECLARED_ISSUER);
      expect(await verifier.verify(token)).toEqual({ token, scopes: ['family:read'] });
    });

    it('accepts a token whose iss is the per-resource discovery URL', async () => {
      await stubDiscovery();
      const verifier = new ScalekitTokenVerifier(DISCOVERY_URL, AUDIENCE);
      const token = await signWith(DISCOVERY_URL);
      expect(await verifier.verify(token)).toEqual({ token, scopes: ['family:read'] });
    });

    it('accepts iss = tenant base origin even when metadata declares the per-resource URL', async () => {
      // The live ChatGPT case: metadata issuer = per-resource URL, token iss = base origin.
      const jwk = { ...(await exportJWK(publicKey)), kid: 'test', alg: 'RS256' };
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string | URL) => {
          const u = String(url);
          if (u.endsWith('/.well-known/oauth-authorization-server')) {
            return new Response(JSON.stringify({ issuer: DISCOVERY_URL, jwks_uri: JWKS_URI }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }
          if (u === JWKS_URI) {
            return new Response(JSON.stringify({ keys: [jwk] }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }
          throw new Error(`unexpected fetch: ${u}`);
        }),
      );
      const verifier = new ScalekitTokenVerifier(DISCOVERY_URL, AUDIENCE);
      const token = await signWith('https://kinnectd.scalekit.dev');
      expect(await verifier.verify(token)).toEqual({ token, scopes: ['family:read'] });
    });

    it('rejects a token from an unrelated issuer', async () => {
      await stubDiscovery();
      const verifier = new ScalekitTokenVerifier(DISCOVERY_URL, AUDIENCE);
      const token = await signWith('https://evil.example');
      expect(await verifier.verify(token)).toBeNull();
    });
  });
});
