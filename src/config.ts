export const config = {
  a2meApiUrl: process.env.A2ME_API_URL || 'http://localhost:8080/api',
  a2meAuthToken: process.env.A2ME_AUTH_TOKEN || 'mock-dev-token',
  mcpServerPort: parseInt(process.env.MCP_SERVER_PORT || '3100', 10),
  serverName: 'a2me-family-context',
  serverVersion: '0.1.0',
};
