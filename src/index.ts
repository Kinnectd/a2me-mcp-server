import { startServer } from './server.js';

startServer().catch((error) => {
  console.error('Failed to start A2Me MCP server:', error);
  process.exit(1);
});
