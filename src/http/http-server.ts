import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response, type NextFunction, type Express } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../server.js';
import { config } from '../config.js';
import { requestContext } from '../request-context.js';
import { createTokenVerifier, type TokenVerifier } from '../auth/token-verifier.js';
import {
  buildProtectedResourceMetadata,
  RESOURCE_METADATA_PATH,
  resourceMetadataUrl,
} from './oauth-metadata.js';

const MCP_PATH = '/mcp';

/**
 * Sanitizes a value before it's forwarded as an outbound request header. Strips control characters
 * (header-injection / `fetch` header-validation errors) and caps length so a hostile or oversized
 * `User-Agent` / tool name can't bloat the outbound headers (proxy 431/400). Returns undefined when
 * nothing usable remains. kinnectd-api normalizes again for storage; this is the boundary defense.
 */
export function sanitizeForwardedHeader(
  raw: string | undefined,
  maxLength: number,
): string | undefined {
  if (!raw) return undefined;
  const cleaned = Array.from(raw)
    // Drop C0 control chars + DEL (header-injection / fetch header-validation), then cap.
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join('')
    .trim()
    .slice(0, maxLength);
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Builds the remote (Streamable HTTP) MCP app: it serves the OAuth protected-resource metadata,
 * gates the MCP endpoint behind a bearer-token check (via the swappable TokenVerifier), and
 * mounts the MCP transport. The verifier is injectable for testing.
 */
export function createHttpApp(verifier: TokenVerifier = createTokenVerifier()): Express {
  const app = express();
  app.use(express.json());

  // Static ChatGPT Apps SDK widget bundles (built into dist-widgets/ by
  // `npm run build:widgets`). Public + CORS: ChatGPT loads these from its own iframe
  // origin, and they contain no user data (data arrives via the authenticated tool
  // call's structuredContent, not from these files).
  const widgetsDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'dist-widgets',
  );
  app.use(
    '/widgets',
    (_req: Request, res: Response, next: NextFunction) => {
      res.set('Access-Control-Allow-Origin', '*');
      next();
    },
    express.static(widgetsDir),
  );

  // RFC 9728 — public, unauthenticated, so clients can discover the authorization server.
  // Serve at the root path and at the path-suffixed variant (RFC 9728 path-insertion), since some
  // clients derive the metadata URL from the resource path (e.g. .../oauth-protected-resource/mcp).
  const metadataHandler = (_req: Request, res: Response): void => {
    res.json(buildProtectedResourceMetadata());
  };
  app.get(RESOURCE_METADATA_PATH, metadataHandler);
  app.get(`${RESOURCE_METADATA_PATH}${MCP_PATH}`, metadataHandler);

  // On a missing/invalid token, challenge with a pointer to the resource metadata so the MCP
  // client knows where to start the OAuth flow (per the MCP authorization spec).
  const requireBearer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    const principal = token ? await verifier.verify(token) : null;
    if (!principal) {
      res
        .status(401)
        .set('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl()}"`)
        .json({ error: 'unauthorized' });
      return;
    }
    // Stash the verified token in res.locals (purpose-built per-request storage); the MCP route
    // below enters the user's async context around the entire handler (not just next()).
    res.locals.a2meToken = principal.token;
    next();
  };

  app.post(MCP_PATH, requireBearer, async (req: Request, res: Response) => {
    const a2meToken = (res.locals.a2meToken as string | undefined) ?? '';
    // Attribution forwarded to kinnectd-api alongside each tool's API call:
    // - tool: the tools/call target name — the request path alone can't identify the tool (tools
    //   share endpoints). Only set for tools/call (not initialize / tools/list).
    // - client: the calling assistant. Stateless transport doesn't carry MCP clientInfo onto tool
    //   calls, so use the request User-Agent (the per-request client signal).
    const body = req.body as { method?: string; params?: { name?: string } } | undefined;
    const mcpTool =
      body?.method === 'tools/call' ? sanitizeForwardedHeader(body.params?.name, 128) : undefined;
    const mcpClient = sanitizeForwardedHeader(req.get('user-agent'), 256);
    // Run the whole request inside the user's context (and await it) so AsyncLocalStorage stays
    // active through transport.handleRequest and the tool handlers. The previous
    // `run(() => next())` exited the context the moment next() returned — before any async tool
    // work ran — so the API client saw an empty store and fell back to the static dev token.
    await requestContext.run({ a2meToken, mcpTool, mcpClient }, async () => {
      // Stateless mode: a fresh server + transport per request avoids cross-client state leakage.
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body as unknown);
    });
  });

  return app;
}

export function startHttpServer(): void {
  const app = createHttpApp();
  app.listen(config.mcpServerPort, () => {
    console.error(
      `A2Me MCP Server v${config.serverVersion} (HTTP) on :${config.mcpServerPort} ` +
        `[auth: ${config.authProvider}]`,
    );
  });
}
