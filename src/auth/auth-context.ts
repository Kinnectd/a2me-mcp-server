import type { AuthContext } from '../types/index.js';

// NOTE: This is NOT the production auth path. Real authentication happens in the
// HTTP transport (Scalekit JWT verified by TokenVerifier before tool dispatch) and
// again in kinnectd-api, which validates the forwarded bearer token and scopes all
// data server-side. The real API client ignores the userId below; this context only
// supplies a local identity for mock mode (stdio / A2ME_USE_MOCK=true).

export function getAuthContext(): AuthContext {
  // Mock identity for local development; unused when serving real data
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
