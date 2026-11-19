# Keeping the connector signed in (refresh tokens)

Findings (dev, 2026-11-19): the Scalekit authorization server already advertises
`grant_types_supported: authorization_code, client_credentials, refresh_token`, PKCE `S256`,
and a DCR `registration_endpoint`. It does **not** advertise scopes. Clients that never ask for a
refresh token (or are not allowed one) fall back to the access-token TTL, so the connector "expires
quickly". This server now advertises `scopes_supported: ["family:read", "offline_access"]` in its
RFC 9728 protected-resource metadata, answers an expired/invalid token with
`WWW-Authenticate: Bearer error="invalid_token", resource_metadata=...` (the cue to refresh), and
tells the assistant to reconnect when kinnectd-api rejects an accepted token (HTTP 401).

## Scalekit dashboard (per environment: Kinnectd Dev, later Prod)

Auth for SaaS -> MCP Servers -> the a2me resource -> Configuration:

1. Scopes: ensure `family:read` and `offline_access` both exist.
2. Refresh tokens: enable. Dynamic client registration clients must be allowed the `refresh_token`
   grant (not just `authorization_code`).
3. Access token lifetime: about 1 hour.
4. Refresh token lifetime: about 90 days, rotation on, with an idle timeout (30 days is reasonable).
5. Keep Server URL = `https://dev.mcp.a2me.app` (no `/mcp`; it is the token `aud`).

## MCP auth spec (2025-06) expectations

- RFC 9728 protected-resource metadata, served at the root and path-suffixed URL (done).
- 401 carries `WWW-Authenticate` with `resource_metadata` (done).
- PKCE S256 and RFC 8707 resource indicators (the token `aud` must equal this resource; done).
- Clients refresh on 401 `invalid_token` using the refresh token; no refresh token means re-login.
