// Cloud Run injects PORT; honor it first, then MCP_SERVER_PORT, then a local default.
const port = process.env.PORT || process.env.MCP_SERVER_PORT || '3100';
// Public URL this server is reachable at — the "resource" in the OAuth protected-resource metadata
// and the expected token audience. Set MCP_PUBLIC_URL to the deployed URL (e.g.
// https://dev.mcp.a2me.app); defaults to localhost for dev.
const mcpPublicUrl = process.env.MCP_PUBLIC_URL || `http://localhost:${port}`;

export const config = {
  // Defaults to a local kinnectd-api so flipping A2ME_USE_MOCK=false never silently calls a shared
  // environment — set A2ME_API_URL explicitly (e.g. https://dev.api.kinnectd.com/api) for dev/prod.
  // Includes the `/api` context path.
  a2meApiUrl: process.env.A2ME_API_URL || 'http://localhost:8080/api',
  // A bearer token for the authenticated user (Firebase ID token today; a hosted-OAuth
  // access token once that lands — see ROADMAP.md). Mocked when useMock is on.
  a2meAuthToken: process.env.A2ME_AUTH_TOKEN || 'mock-dev-token',
  // When true (default), tools return mock family data and never call the live API. Set
  // A2ME_USE_MOCK=false to exercise the real integration. NOTE: only getFamilyMembers makes a live
  // call so far; the other client methods still return mock data until Phase 0 wires them.
  useMock: (process.env.A2ME_USE_MOCK || 'true').toLowerCase() !== 'false',
  // Timeout (ms) for outbound kinnectd-api calls, so a hung connection can't stall a tool request.
  requestTimeoutMs: parseInt(process.env.A2ME_REQUEST_TIMEOUT_MS || '10000', 10),
  mcpServerPort: parseInt(port, 10),
  // Transport: 'stdio' (local, default) or 'http' (remote Streamable HTTP — needed for the
  // hosted OAuth "Connect a2me" flow). See docs/auth-design.md.
  transport: (process.env.MCP_TRANSPORT || 'stdio').toLowerCase(),
  mcpPublicUrl,
  // Token verifier: 'dev' (forwards the bearer unverified — DEV ONLY) or 'scalekit' (validates the
  // Scalekit-issued JWT against the issuer's JWKS).
  authProvider: (process.env.MCP_AUTH_PROVIDER || 'dev').toLowerCase(),
  // Scalekit authorization server (the metadata's `authorization_servers`), e.g.
  // https://kinnectd.scalekit.dev/resources/res_130696843431510786
  authServerIssuer: process.env.MCP_AUTH_ISSUER || '',
  // Expected token audience — the MCP server's resource URL. Defaults to the public URL.
  authAudience: process.env.MCP_AUTH_AUDIENCE || mcpPublicUrl,
  serverName: 'a2me-family-context',
  serverVersion: '0.1.0',
};
