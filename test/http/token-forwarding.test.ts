import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { TokenVerifier } from '../../src/auth/token-verifier.js';

/**
 * Locks the contract that a tool call reaches kinnectd-api with the *caller's* token (from the
 * per-request async context), not the static fallback — the behavior the token-forwarding fix
 * guarantees. (Note: a single-request test like this doesn't reproduce the original prod failure,
 * which only showed up under the live transport; this guards the forwarding contract going forward.)
 */
describe('per-request token forwarding (E2E through the MCP app)', () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('forwards the caller token (not mock-dev-token) on a tool call', async () => {
    // useMock=false so the tool actually calls the API; re-import modules to pick up the env.
    vi.stubEnv('A2ME_USE_MOCK', 'false');
    vi.resetModules();

    // Intercept only the outbound kinnectd-api call; let everything else (the test's own request to
    // the MCP server) hit the real fetch.
    const realFetch = globalThis.fetch;
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes('/me/v2/family')) {
        return new Response(JSON.stringify({ viewerUserId: 'u', members: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return realFetch(url as RequestInfo, init);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { createHttpApp } = await import('../../src/http/http-server.js');
    const verifier: TokenVerifier = {
      name: 'test',
      verify: async () => ({ token: 'user-token-xyz', scopes: ['family:read'] }),
    };
    const app = createHttpApp(verifier);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const { port } = server!.address() as AddressInfo;

    const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: 'Bearer caller-bearer',
        'User-Agent': 'claude-ai/1.2.3',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'get_family_members', arguments: {} },
      }),
    });
    await res.text(); // drain the SSE response so the tool has finished executing

    const apiCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('/me/v2/family'));
    expect(apiCall, 'expected an outbound /me/v2/family call').toBeTruthy();
    const headers = (apiCall![1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer user-token-xyz');
    // Usage-attribution headers forwarded to kinnectd-api.
    expect(headers['X-MCP-Tool']).toBe('get_family_members');
    expect(headers['X-MCP-Client']).toBe('claude-ai/1.2.3');
  });
});
