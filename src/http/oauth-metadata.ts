import { config } from '../config.js';

/** OAuth 2.0 Protected Resource Metadata (RFC 9728) — how an MCP client discovers our auth server. */
export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported: string[];
  bearer_methods_supported: string[];
}

export const RESOURCE_METADATA_PATH = '/.well-known/oauth-protected-resource';

export function buildProtectedResourceMetadata(): ProtectedResourceMetadata {
  return {
    resource: config.mcpPublicUrl,
    // The managed provider's issuer (Scalekit). Empty until configured — clients then have nothing
    // to discover, which is correct pre-launch.
    authorization_servers: config.authServerIssuer ? [config.authServerIssuer] : [],
    scopes_supported: ['family:read'],
    bearer_methods_supported: ['header'],
  };
}

/** Absolute URL of the resource-metadata document, used in the 401 WWW-Authenticate challenge. */
export function resourceMetadataUrl(): string {
  return `${config.mcpPublicUrl}${RESOURCE_METADATA_PATH}`;
}
