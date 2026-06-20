import express, { type Request, type Response, type NextFunction, type Express } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../server.js';
import { config } from '../config.js';
import { createTokenVerifier, type TokenVerifier } from '../auth/token-verifier.js';
import {
  buildProtectedResourceMetadata,
  RESOURCE_METADATA_PATH,
  resourceMetadataUrl,
} from './oauth-metadata.js';

const MCP_PATH = '/mcp';

/**
 * Builds the remote (Streamable HTTP) MCP app: it serves the OAuth protected-resource metadata,
 * gates the MCP endpoint behind a bearer-token check (via the swappable TokenVerifier), and
 * mounts the MCP transport. The verifier is injectable for testing.
 */
export function createHttpApp(verifier: TokenVerifier = createTokenVerifier()): Express {
  const app = express();
  app.use(express.json());

  // RFC 9728 — public, unauthenticated, so clients can discover the authorization server.
  app.get(RESOURCE_METADATA_PATH, (_req: Request, res: Response) => {
    res.json(buildProtectedResourceMetadata());
  });

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
    // TODO(next): thread principal.token into the tool handlers so each call hits kinnectd-api as
    // this user. Today the tools read config.a2meAuthToken (single-user dev mode).
    next();
  };

  app.post(MCP_PATH, requireBearer, async (req: Request, res: Response) => {
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
