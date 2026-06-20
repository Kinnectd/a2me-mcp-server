import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import { config } from '../config.js';

/** A jose key source: a remote JWKS resolver, or a key (used in tests). */
type KeyInput = Parameters<typeof jwtVerify>[1];

/** Pulls granted scopes from the standard `scope` (space-delimited) or `scp` (array) claim. */
function extractScopes(payload: JWTPayload): string[] {
  if (typeof payload.scope === 'string') return payload.scope.split(' ').filter(Boolean);
  if (Array.isArray(payload.scp)) return payload.scp.map(String);
  return [];
}

/**
 * The authenticated caller behind an MCP request. Provider-agnostic by design — see
 * docs/auth-design.md ("Why this honors swap later"). Swapping auth providers means swapping the
 * TokenVerifier implementation; nothing else in the server changes.
 */
export interface VerifiedPrincipal {
  /** The bearer token to forward to kinnectd-api on the user's behalf. */
  token: string;
  /** Granted OAuth scopes (e.g. ["family:read"]). */
  scopes: string[];
}

export interface TokenVerifier {
  readonly name: string;
  /** Returns the principal for a valid token, or null to reject (→ 401 challenge). */
  verify(bearerToken: string): Promise<VerifiedPrincipal | null>;
}

/**
 * DEV ONLY. Accepts any non-empty bearer and forwards it downstream unverified — kinnectd-api
 * still validates it (Firebase today). Lets us exercise the HTTP transport before a real OAuth
 * provider is wired. Never enable in production.
 */
export class DevTokenVerifier implements TokenVerifier {
  readonly name = 'dev';

  async verify(bearerToken: string): Promise<VerifiedPrincipal | null> {
    if (!bearerToken) return null;
    return { token: bearerToken, scopes: ['family:read'] };
  }
}

/**
 * Validates a JWT access token issued by Scalekit (the managed authorization server). Verifies the
 * signature against the issuer's JWKS and checks `iss`, `aud`, and `exp`; an invalid/expired token
 * resolves to null (→ 401 challenge). The JWKS URL is discovered from the issuer's authorization-
 * server metadata, so only the issuer + audience need configuring.
 */
export class ScalekitTokenVerifier implements TokenVerifier {
  readonly name = 'scalekit';
  private keys?: KeyInput;

  constructor(
    private readonly issuer: string,
    private readonly audience: string,
    // Injectable key source for tests; production discovers a remote JWKS lazily.
    keys?: KeyInput,
  ) {
    this.keys = keys;
  }

  /** Lazily resolves (and caches) the JWKS, discovering its URL from the AS metadata. */
  private async resolveKeys(): Promise<KeyInput> {
    if (this.keys) return this.keys;
    if (!this.issuer) throw new Error('Scalekit issuer is not configured (MCP_AUTH_ISSUER)');
    const res = await fetch(`${this.issuer}/.well-known/oauth-authorization-server`);
    if (!res.ok) {
      throw new Error(`Scalekit AS metadata fetch failed: ${res.status} ${res.statusText}`);
    }
    const meta = (await res.json()) as { jwks_uri?: string };
    if (!meta.jwks_uri) throw new Error('Scalekit AS metadata missing jwks_uri');
    this.keys = createRemoteJWKSet(new URL(meta.jwks_uri));
    return this.keys;
  }

  async verify(bearerToken: string): Promise<VerifiedPrincipal | null> {
    if (!bearerToken) return null;
    try {
      const keys = await this.resolveKeys();
      const { payload } = await jwtVerify(bearerToken, keys as JWTVerifyGetKey, {
        issuer: this.issuer,
        audience: this.audience,
      });
      return { token: bearerToken, scopes: extractScopes(payload) };
    } catch {
      // Bad signature / wrong iss-aud / expired / malformed — reject without leaking specifics.
      return null;
    }
  }
}

/** Picks the verifier from config (MCP_AUTH_PROVIDER). Defaults to the dev verifier. */
export function createTokenVerifier(): TokenVerifier {
  if (config.authProvider === 'scalekit') {
    return new ScalekitTokenVerifier(config.authServerIssuer, config.authAudience);
  }
  return new DevTokenVerifier();
}
