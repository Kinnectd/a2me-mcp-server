import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHttpApp } from '../../src/http/http-server.js';
import { DevTokenVerifier } from '../../src/auth/token-verifier.js';

describe('MCP HTTP app', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createHttpApp(new DevTokenVerifier());
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('serves OAuth protected-resource metadata publicly', async () => {
    const res = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
    expect(res.status).toBe(200);
    const md = (await res.json()) as { scopes_supported: string[] };
    expect(md.scopes_supported).toEqual(['family:read']);
  });

  it('challenges an unauthenticated MCP request with a 401 + resource_metadata pointer', async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toContain('resource_metadata=');
  });
});
