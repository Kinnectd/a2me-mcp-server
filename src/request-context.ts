import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context for the remote (HTTP) transport. The auth middleware stashes the
 * authenticated user's bearer token here so the A2Me API client forwards *that* token to
 * kinnectd-api (acting as the user), instead of the single static dev token. Empty in stdio mode.
 */
export interface RequestContext {
  /** The caller's verified bearer token, forwarded to kinnectd-api on their behalf. */
  a2meToken: string;
  /** The MCP tool being executed (from the tools/call body), forwarded as `X-MCP-Tool` so the api
   * can attribute access to a specific tool — the request path alone can't (tools share endpoints). */
  mcpTool?: string;
  /** The calling assistant, forwarded as `X-MCP-Client` (the "via Claude" detail). From the request
   * `User-Agent`: in stateless transport the MCP `clientInfo` isn't available on tool calls. */
  mcpClient?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
