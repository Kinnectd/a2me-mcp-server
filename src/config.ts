export const config = {
  // Default to the dev API; override with A2ME_API_URL. Includes the `/api` context path.
  a2meApiUrl: process.env.A2ME_API_URL || 'https://dev.api.kinnectd.com/api',
  // A bearer token for the authenticated user (Firebase ID token today; a hosted-OAuth
  // access token once that lands — see ROADMAP.md). Mocked when useMock is on.
  a2meAuthToken: process.env.A2ME_AUTH_TOKEN || 'mock-dev-token',
  // When true (default), tools return mock family data and never call the live API. Set
  // A2ME_USE_MOCK=false to exercise the real kinnectd-api integration.
  useMock: (process.env.A2ME_USE_MOCK || 'true').toLowerCase() !== 'false',
  mcpServerPort: parseInt(process.env.MCP_SERVER_PORT || '3100', 10),
  serverName: 'a2me-family-context',
  serverVersion: '0.1.0',
};
