import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHttpApp } from '../../src/http/http-server.js';
import { DevTokenVerifier } from '../../src/auth/token-verifier.js';
import { config } from '../../src/config.js';

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

  it('serves a self-describing landing page and llms.txt at the root', async () => {
    const landing = await fetch(`${baseUrl}/`);
    expect(landing.status).toBe(200);
    const html = await landing.text();
    expect(html).toContain('A2Me MCP Server');
    expect(html).toContain('https://mcp.a2me.app/mcp');

    const llms = await fetch(`${baseUrl}/llms.txt`);
    expect(llms.status).toBe(200);
    const text = await llms.text();
    expect(text).toContain('Connector URL');
    expect(text).toContain('https://a2me.app/llms.txt');
  });

  it('serves OAuth protected-resource metadata publicly', async () => {
    const res = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
    expect(res.status).toBe(200);
    const md = (await res.json()) as { scopes_supported: string[] };
    expect(md.scopes_supported).toEqual(['family:read']);
  });

  it('serves the OpenAI Apps challenge token when configured, 404 when not', async () => {
    const original = config.openaiAppsChallengeToken;
    try {
      config.openaiAppsChallengeToken = '';
      const missing = await fetch(`${baseUrl}/.well-known/openai-apps-challenge`);
      expect(missing.status).toBe(404);

      config.openaiAppsChallengeToken = 'test-challenge-token-123';
      const res = await fetch(`${baseUrl}/.well-known/openai-apps-challenge`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/plain');
      expect(await res.text()).toBe('test-challenge-token-123');
    } finally {
      config.openaiAppsChallengeToken = original;
    }
  });

  it('answers GET/DELETE on the MCP endpoint with 405 + Allow: POST (no SSE stream offered)', async () => {
    const get = await fetch(`${baseUrl}/mcp`, { headers: { Accept: 'text/event-stream' } });
    expect(get.status).toBe(405);
    expect(get.headers.get('allow')).toBe('POST');

    const del = await fetch(`${baseUrl}/mcp`, { method: 'DELETE' });
    expect(del.status).toBe(405);
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
