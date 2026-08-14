import type { AuthContext } from '../types/index.js';

// NOTE: This is NOT the production auth path. Request authentication happens in the
// HTTP transport via the pluggable TokenVerifier (ScalekitTokenVerifier in production;
// a permissive DevTokenVerifier exists for local development) before tool dispatch,
// and again in kinnectd-api, which validates the forwarded bearer token and scopes all
// data server-side. Tools still read this context's userId for local filtering and
// resolution, but live API scoping comes from the bearer token, not this ID.

export function getAuthContext(): AuthContext {
  // Mock identity; live data access is scoped by the per-request bearer token
  return {
    userId: 'user-001',
    displayName: 'Alex Walker',
    isAuthenticated: true,
  };
}

export function requireAuth(): AuthContext {
  const ctx = getAuthContext();
  if (!ctx.isAuthenticated) {
    throw new Error('Authentication required. This MCP server requires a valid A2Me session.');
  }
  return ctx;
}
