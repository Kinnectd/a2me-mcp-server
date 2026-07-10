import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Use the automatic JSX runtime so widget component tests don't need `import React`.
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    globals: true,
  },
});
