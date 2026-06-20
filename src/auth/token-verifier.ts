import { config } from '../config.js';

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
 * Validates an access token issued by the managed provider (Scalekit). Not yet wired — needs the
 * issuer/JWKS/audience from the provider dashboard (see docs/auth-design.md "What Byron owns").
 */
export class ScalekitTokenVerifier implements TokenVerifier {
  readonly name = 'scalekit';

  constructor(
    private readonly issuer: string,
    private readonly audience: string,
  ) {}

  async verify(_bearerToken: string): Promise<VerifiedPrincipal | null> {
    // TODO(Phase 2): fetch JWKS from `${issuer}/.well-known/jwks.json`, verify the JWT signature,
    // check iss/aud/exp, and map scopes. Until configured, fail loudly so we never silently accept.
    throw new Error(
      `ScalekitTokenVerifier not wired (issuer=${this.issuer || 'unset'}, aud=${this.audience || 'unset'}). ` +
        'Set MCP_AUTH_PROVIDER=dev until Scalekit is configured.',
    );
  }
}

/** Picks the verifier from config (MCP_AUTH_PROVIDER). Defaults to the dev verifier. */
export function createTokenVerifier(): TokenVerifier {
  if (config.authProvider === 'scalekit') {
    return new ScalekitTokenVerifier(config.authServerIssuer, config.authAudience);
  }
  return new DevTokenVerifier();
}
