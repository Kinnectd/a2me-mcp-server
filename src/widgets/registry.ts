import { config } from '../config.js';

/**
 * ChatGPT Apps SDK widgets. Each widget is a React bundle (built by
 * `widgets/build-widgets.mts` into `dist-widgets/<asset>.js|.css`) that renders a
 * tool's `structuredContent`. A tool opts into a widget by carrying the
 * `openai/outputTemplate` pointer in its `_meta`; ChatGPT then fetches the matching
 * `ui://` resource and renders it in an iframe.
 *
 * Assets are served by our own server (see http-server static route), so the HTML
 * wrapper references absolute `${MCP_PUBLIC_URL}/widgets/...` URLs. The wrapper is
 * generated at read time (not build time) so one build works across dev/prod.
 */
export interface WidgetDef {
  /** The MCP tool this widget renders for. */
  toolName: string;
  /** Built asset base name in dist-widgets/ (`<asset>.js`, `<asset>.css`). */
  asset: string;
  /** `ui://` template URI referenced by the tool's outputTemplate + the resource. */
  templateUri: string;
  title: string;
  /** Status strings ChatGPT shows while the tool runs / after it finishes. */
  invoking: string;
  invoked: string;
}

export const WIDGETS: WidgetDef[] = [
  {
    toolName: 'get_upcoming_family_dates',
    asset: 'upcoming-dates',
    templateUri: 'ui://widget/upcoming-dates.html',
    title: 'Upcoming family dates',
    invoking: 'Checking upcoming family dates',
    invoked: 'Here are the upcoming dates',
  },
  {
    toolName: 'get_family_members',
    asset: 'family-members',
    templateUri: 'ui://widget/family-members.html',
    title: 'Your family',
    invoking: 'Gathering your family',
    invoked: 'Here is your family',
  },
];

const byTool = new Map(WIDGETS.map((w) => [w.toolName, w]));
const byUri = new Map(WIDGETS.map((w) => [w.templateUri, w]));

export function widgetForTool(toolName: string): WidgetDef | undefined {
  return byTool.get(toolName);
}

export function widgetForUri(uri: string): WidgetDef | undefined {
  return byUri.get(uri);
}

/** ChatGPT-specific tool `_meta` linking the tool to its rendered widget. */
export function widgetToolMeta(w: WidgetDef): Record<string, unknown> {
  return {
    'openai/outputTemplate': w.templateUri,
    'openai/toolInvocation/invoking': w.invoking,
    'openai/toolInvocation/invoked': w.invoked,
    'openai/widgetAccessible': true,
  };
}

/** The MIME type ChatGPT expects for renderable Apps SDK widget markup. */
export const WIDGET_MIME_TYPE = 'text/html+skybridge';

/**
 * The `text/html+skybridge` document ChatGPT loads in the widget iframe. It pulls the
 * built bundle + styles from this server; the widget then reads `window.openai.toolOutput`
 * (the tool's structuredContent) and renders. `?v=` busts the CDN/iframe cache per release.
 */
export function widgetHtml(w: WidgetDef): string {
  const base = config.mcpPublicUrl.replace(/\/+$/, '');
  const v = encodeURIComponent(config.serverVersion);
  return [
    '<!doctype html>',
    '<html>',
    '<head><meta charset="utf-8" />',
    `<link rel="stylesheet" href="${base}/widgets/${w.asset}.css?v=${v}" />`,
    '</head>',
    '<body>',
    '<div id="root"></div>',
    `<script type="module" src="${base}/widgets/${w.asset}.js?v=${v}"></script>`,
    '</body>',
    '</html>',
  ].join('\n');
}
