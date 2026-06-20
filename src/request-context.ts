import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context for the remote (HTTP) transport. The auth middleware stashes the
 * authenticated user's bearer token here so the A2Me API client forwards *that* token to
 * kinnectd-api (acting as the user), instead of the single static dev token. Empty in stdio mode.
 */
export interface RequestContext {
  /** The caller's verified bearer token, forwarded to kinnectd-api on their behalf. */
  a2meToken: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
