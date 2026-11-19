import { describe, it, expect } from 'vitest';
import { isIgnoredPath, resolveProjectId, resolveSampleRatio } from '../src/tracing.js';

describe('tracing config', () => {
  it('is dark (0) by default and in prod', () => {
    expect(resolveSampleRatio({})).toBe(0);
    expect(resolveSampleRatio({ MCP_PUBLIC_URL: 'https://mcp.a2me.app' })).toBe(0);
  });
  it('samples 20% on dev', () => {
    expect(resolveSampleRatio({ MCP_PUBLIC_URL: 'https://dev.mcp.a2me.app' })).toBe(0.2);
  });
  it('lets OTEL_TRACES_SAMPLER_ARG override, clamped to [0, 1]', () => {
    expect(resolveSampleRatio({ OTEL_TRACES_SAMPLER_ARG: '0.05' })).toBe(0.05);
    expect(resolveSampleRatio({ OTEL_TRACES_SAMPLER_ARG: '7' })).toBe(1);
    expect(
      resolveSampleRatio({
        OTEL_TRACES_SAMPLER_ARG: 'nope',
        MCP_PUBLIC_URL: 'https://mcp.a2me.app',
      }),
    ).toBe(0);
  });
  it('ignores health probes', () => {
    expect(isIgnoredPath('/health')).toBe(true);
    expect(isIgnoredPath('/mcp')).toBe(false);
  });
  it('routes spans to the right project', () => {
    expect(resolveProjectId({ MCP_PUBLIC_URL: 'https://dev.mcp.a2me.app' })).toBe('kinnectd-dev');
    expect(resolveProjectId({ MCP_PUBLIC_URL: 'https://mcp.a2me.app' })).toBe('kinnectd-prod');
    expect(resolveProjectId({ GOOGLE_CLOUD_PROJECT: 'x' })).toBe('x');
  });
});
