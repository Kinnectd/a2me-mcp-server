/**
 * OpenTelemetry tracing -> Google Cloud Trace. Preloaded before the app
 * (`node --import ./dist/tracing.js dist/index.js`) so the http/express/undici
 * instrumentations patch modules before they are first imported.
 *
 * Ships DARK in prod: the sampling ratio is 0 unless OTEL_TRACES_SAMPLER_ARG says otherwise, so
 * turning prod on later is a single env var (e.g. OTEL_TRACES_SAMPLER_ARG=0.05). Dev (a
 * `dev.` MCP_PUBLIC_URL) defaults to 0.2. Spans go to Cloud Trace over OTLP (telemetry.googleapis.com, ADC bearer
 * token), since the Google Node exporter is deprecated. Export is fail-open: with no ADC or a rejected export,
 * spans are dropped and requests are unaffected. Incoming W3C `traceparent` is honoured (parent-based)
 * and propagated on outbound calls to kinnectd-api, so one trace spans MCP -> api.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { GoogleAuth } from 'google-auth-library';

/** Sampling ratio in [0, 1]; invalid or unset values fall back to the per-env default. */
export function resolveSampleRatio(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.OTEL_TRACES_SAMPLER_ARG;
  if (raw !== undefined && raw.trim() !== '') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return Math.min(1, Math.max(0, parsed));
  }
  return (env.MCP_PUBLIC_URL ?? '').includes('://dev.') ? 0.2 : 0;
}

/** Cloud Trace routes spans by the `gcp.project_id` resource attribute. */
export function resolveProjectId(env: NodeJS.ProcessEnv = process.env): string {
  return (
    env.GOOGLE_CLOUD_PROJECT ||
    env.GCP_PROJECT ||
    ((env.MCP_PUBLIC_URL ?? '').includes('://dev.') ? 'kinnectd-dev' : 'kinnectd-prod')
  );
}

/** Health checks and probes are never traced. */
export function isIgnoredPath(url: string | undefined): boolean {
  return !!url && /^\/(health|healthz|_ah|favicon)/.test(url);
}

export function startTracing(env: NodeJS.ProcessEnv = process.env): NodeSDK | undefined {
  if ((env.OTEL_SDK_DISABLED ?? '').toLowerCase() === 'true') return undefined;
  try {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const traceExporter = new OTLPTraceExporter({
      url: env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'https://telemetry.googleapis.com/v1/traces',
      headers: async () => {
        try {
          return Object.fromEntries((await auth.getRequestHeaders()).entries());
        } catch {
          return {}; // no credentials: the export is rejected and spans dropped (fail open)
        }
      },
    });
    const sdk = new NodeSDK({
      resource: resourceFromAttributes({ 'gcp.project_id': resolveProjectId(env) }),
      serviceName: env.OTEL_SERVICE_NAME || 'a2me-mcp-server',
      sampler: new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(resolveSampleRatio(env)),
      }),
      traceExporter,
      instrumentations: [
        new HttpInstrumentation({
          ignoreIncomingRequestHook: (req) => isIgnoredPath(req.url),
        }),
        new ExpressInstrumentation(),
        new UndiciInstrumentation(),
      ],
    });
    sdk.start();
    const stop = () => {
      sdk.shutdown().catch(() => undefined);
    };
    process.once('SIGTERM', stop);
    return sdk;
  } catch (error) {
    // Fail open: tracing must never stop the server from starting.
    console.error('OpenTelemetry tracing failed to start; continuing without it:', error);
    return undefined;
  }
}

if (!process.env.VITEST) startTracing();
