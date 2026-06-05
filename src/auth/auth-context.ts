import type { AuthContext } from '../types/index.js';

// TODO: Replace with real OAuth/token validation against A2Me API
// In production, this will validate the user's session token against
// the A2Me authentication service (Firebase Auth + Spring Security).

export function getAuthContext(): AuthContext {
  // Mock: always returns authenticated user for local development
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
