// Builds each ChatGPT Apps SDK widget (widgets/src/<name>/index.tsx) into a single
// self-contained ES bundle + CSS in dist-widgets/. The MCP server serves these as
// static assets and generates the `text/html+skybridge` wrapper at runtime (injecting
// the correct public URL per environment), so no base URL is baked in here.
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'src');
const OUT = path.resolve(__dirname, '..', 'dist-widgets');

const widgets = fs
  .readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'shared')
  .map((d) => d.name)
  .filter((name) => fs.existsSync(path.join(SRC, name, 'index.tsx')));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const name of widgets) {
  await build({
    root: __dirname,
    configFile: false,
    logLevel: 'warn',
    plugins: [react()],
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      outDir: OUT,
      emptyOutDir: false,
      cssCodeSplit: false,
      minify: 'esbuild',
      target: 'es2022',
      lib: {
        entry: path.join(SRC, name, 'index.tsx'),
        formats: ['es'],
        fileName: () => `${name}.js`,
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          assetFileNames: (info) =>
            (info.names?.[0] ?? info.name ?? '').endsWith('.css')
              ? `${name}.css`
              : '[name][extname]',
        },
      },
    },
  });
  // eslint-disable-next-line no-console
  console.log(`built widget: ${name}`);
}

// eslint-disable-next-line no-console
console.log(`\n${widgets.length} widget(s) → ${OUT}`);
