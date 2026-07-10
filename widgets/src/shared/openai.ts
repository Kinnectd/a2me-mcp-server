// Minimal typing + React hook for the ChatGPT Apps SDK host bridge (`window.openai`).
// The host injects `window.openai` into the widget iframe and dispatches an
// `openai:set_globals` event whenever globals (toolOutput, theme, displayMode…) change.
// Widgets read their data from `window.openai.toolOutput` — which is exactly the
// `structuredContent` returned by the tool call that rendered them.
import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
export type DisplayMode = 'inline' | 'pip' | 'fullscreen';

export interface OpenAiGlobals<ToolOutput = Record<string, unknown>> {
  theme: Theme;
  displayMode: DisplayMode;
  maxHeight: number;
  locale: string;
  toolOutput: ToolOutput | null;
}

declare global {
  interface Window {
    openai?: Partial<OpenAiGlobals> & Record<string, unknown>;
  }
}

const SET_GLOBALS_EVENT_TYPE = 'openai:set_globals';

function read<K extends keyof OpenAiGlobals>(key: K): OpenAiGlobals[K] | null {
  if (typeof window === 'undefined') return null;
  const value = window.openai?.[key];
  return (value ?? null) as OpenAiGlobals[K] | null;
}

/** Subscribe to a single `window.openai` global, re-rendering when the host updates it. */
export function useOpenAiGlobal<K extends keyof OpenAiGlobals>(key: K): OpenAiGlobals[K] | null {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => {};
      const handler = () => onChange();
      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handler, { passive: true });
      // The host may set globals before this listener attaches; poll briefly to catch the
      // first paint, then rely on the event.
      let ticks = 20;
      const poll = window.setInterval(() => {
        if (read(key) !== null || --ticks <= 0) {
          window.clearInterval(poll);
          onChange();
        }
      }, 100);
      return () => {
        window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handler);
        window.clearInterval(poll);
      };
    },
    () => read(key),
    () => null,
  );
}

/** The tool result payload (the tool's `structuredContent`), typed by the caller. */
export function useToolOutput<T>(): T | null {
  return useOpenAiGlobal('toolOutput') as T | null;
}

/** Current host theme ('light' by default). */
export function useTheme(): Theme {
  return (useOpenAiGlobal('theme') as Theme | null) ?? 'light';
}
