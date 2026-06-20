# Auth design — "Connect a2me" for MCP

> Decision (Byron, 2026-06-19): **vendor-agnostic seam + managed provider, swap later** — the same
> playbook as identity verification (Persona) and keepsakes (Gelato/Lulu). Ship v1 on a managed
> MCP-auth provider federated to Firebase; keep the option to bring the authorization server
> in-house (Spring Authorization Server) later without changing the rest of the system.

## The actual problem

User _login_ is already solved — Firebase is a2me's IdP. The missing piece is the **OAuth 2.1
Authorization Server (AS)** that remote MCP clients require: protected-resource metadata
(RFC 9728), Dynamic Client Registration / Client-ID-Metadata, PKCE, a consent screen, and scoped
token issuance + refresh + revocation. Firebase Auth is **not** an OAuth AS for third-party
clients, so a Claude/ChatGPT MCP client can't point at it directly. Something must speak the
OAuth-for-MCP protocol in front of Firebase. We **buy** that piece for v1.

## Components

```
┌────────────┐   OAuth 2.1 (DCR, PKCE, consent)   ┌──────────────────────┐
│ MCP client │ ────────────────────────────────► │  Managed AS          │
│ (Claude/   │   user authorizes "Connect a2me"   │  (Scalekit/Auth0/…)  │
│  ChatGPT)  │ ◄──────────── access token ─────── │  federates → Firebase│
└─────┬──────┘                                     └──────────┬───────────┘
      │ MCP calls with Authorization: Bearer <access token>   │ user signs in
      ▼                                                        ▼ via Firebase
┌──────────────────────────┐   Bearer (forwarded)   ┌────────────────────────┐
│ a2me-mcp-server          │ ─────────────────────► │ kinnectd-api           │
│ (OAuth Resource Server)  │                        │ new MCP-token auth path │
│ • serves /.well-known/   │                        │ • validates AS JWT      │
│   oauth-protected-       │                        │   (issuer+JWKS+aud)     │
│   resource               │                        │ • maps sub→a2me user    │
│ • validates token (seam) │                        │ • read-only scope-gated │
│ • read-only family tools │                        └────────────────────────┘
└──────────────────────────┘
```

1. **Managed provider = the AS.** Handles the full MCP OAuth handshake (metadata, DCR/CIMD, PKCE,
   consent), authenticates the user by **federating to Firebase** (OIDC upstream), and issues a
   scoped, refreshable access token. The token's subject carries the Firebase uid (preserved
   through federation) so it ties back to an a2me user.
2. **a2me-mcp-server = an OAuth Resource Server.** It advertises
   `/.well-known/oauth-protected-resource` (points at the AS), validates the incoming access token
   via a **pluggable verifier seam** (`TokenVerifier`), and runs the read-only family tools. It
   forwards the same Bearer token to kinnectd-api.
3. **kinnectd-api gains a second token path.** Today it validates Firebase ID tokens via the custom
   `FirebaseTokenFilter` (`FirebaseAuth.verifyIdToken`), with a parallel
   `SystemAccountAuthenticationFilter` for internal keys. We add a third, parallel
   `McpTokenAuthenticationFilter` (mirrors how the system-account filter was added) that:
   - validates the managed-AS JWT (issuer + JWKS + audience),
   - resolves the a2me user from the subject (Firebase uid → existing `firebaseUserId` lookup, or
     a custom `a2me_uid` claim),
   - grants a **read-only** authority/scope (`family:read`),
   - is accepted **only** on the GET endpoints the MCP tools use (scope- + path-gated).

   No change to the existing Firebase or system-account paths.

## Why this honors "swap later"

- **MCP server:** all token validation goes through one `TokenVerifier` interface. v1 implements
  `ManagedProviderTokenVerifier` (validate the provider's JWT). Bringing auth in-house later =
  a new `SpringAuthServerTokenVerifier` + repointing the `.well-known` metadata. Tools untouched.
- **kinnectd-api:** the `McpTokenAuthenticationFilter` is configured by _issuer + JWKS URL_. Moving
  to a self-hosted Spring Authorization Server is a config change (new issuer/JWKS), not a rewrite.

## Recommended provider for v1

**Scalekit** — purpose-built "drop-in OAuth for MCP servers" (OAuth 2.1, scopes, PKCE, DCR/CIMD),
federates to existing IdPs, lightweight. Best fit for shipping the MCP flow fast.

Alternates (same seam, swappable): **Auth0** (most mature, B2C-friendly, heavier/pricier) ·
**WorkOS AuthKit** (strong DX, B2B-leaning). **Avoid Stytch** for now — acquired by Twilio in late
2025 (roadmap churn). Final pick is reversible by design.

## Scopes (start minimal)

- `family:read` — the only scope for read-only v1. Phase 4 (writes) adds `family:write`,
  `posts:write`, etc. The MCP-token path in kinnectd-api is read-only regardless until those land.

## Build increments

1. **MCP server resource-server scaffolding** — `.well-known/oauth-protected-resource`, the
   `TokenVerifier` seam + a no-op/dev verifier, and a 401-with-`WWW-Authenticate` challenge. (No
   provider account needed yet; works with the Phase-1 HTTP transport.)
2. **Provider wiring** — `ManagedProviderTokenVerifier` against the chosen provider's issuer/JWKS;
   federation to Firebase configured in the provider dashboard.
3. **kinnectd-api `McpTokenAuthenticationFilter`** — validate AS JWT, map subject → user, read-only
   - path-gated. Separate PR in kinnectd-api (security-critical; gets its own review).
4. **End-to-end** — connect from Claude against dev, confirm `get_family_members` returns the real
   user's family.

## What Byron owns (provider setup — like Persona / SendGrid / print vendors)

- Create the managed-provider account (Scalekit unless you prefer Auth0/WorkOS).
- Configure **Firebase as the upstream OIDC IdP** in the provider so users sign in with their a2me
  (Firebase) account, and the **Firebase uid flows into the token subject**.
- Register the `family:read` scope and the a2me-mcp-server as the protected resource.
- Provide issuer URL + JWKS URL + audience → stored in GCP Secret Manager (never committed).

## Open sub-decisions (can default)

- **Token format:** signed JWT validated offline via JWKS (default) vs opaque + introspection. JWT
  is simpler for both the MCP server and kinnectd-api → default to JWT.
- **Identity claim:** rely on the federated Firebase uid in `sub` (preferred — kinnectd-api already
  maps `firebaseUserId` → user) vs a custom `a2me_uid` claim.
