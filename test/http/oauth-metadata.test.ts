import { describe, it, expect } from 'vitest';
import {
  buildProtectedResourceMetadata,
  RESOURCE_METADATA_PATH,
  resourceMetadataUrl,
} from '../../src/http/oauth-metadata.js';

describe('protected resource metadata', () => {
  it('advertises the resource, read-only scope, and header bearer method', () => {
    const md = buildProtectedResourceMetadata();
    expect(md.resource).toBeTruthy();
    expect(md.scopes_supported).toEqual(['family:read']);
    expect(md.bearer_methods_supported).toEqual(['header']);
  });

  it('has no authorization server until one is configured', () => {
    // Default config leaves MCP_AUTH_ISSUER unset, which is correct pre-launch.
    expect(buildProtectedResourceMetadata().authorization_servers).toEqual([]);
  });

  it('exposes the metadata document at the RFC 9728 path', () => {
    expect(RESOURCE_METADATA_PATH).toBe('/.well-known/oauth-protected-resource');
    expect(resourceMetadataUrl().endsWith(RESOURCE_METADATA_PATH)).toBe(true);
  });
});
