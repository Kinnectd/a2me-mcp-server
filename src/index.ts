import { config } from './config.js';
import { startServer } from './server.js';

async function main(): Promise<void> {
  if (config.transport === 'http') {
    const { startHttpServer } = await import('./http/http-server.js');
    startHttpServer();
  } else {
    await startServer();
  }
}

main().catch((error) => {
  console.error('Failed to start A2Me MCP server:', error);
  process.exit(1);
});
