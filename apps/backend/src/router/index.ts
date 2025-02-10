import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function registerRoutes(fastify: FastifyInstance) {
  const routesDir = __dirname; 

  // Read all files in the router directory
  const files = fs.readdirSync(routesDir);

  for (const file of files) {
    // Skip index.ts or index.js to avoid self-import
    if (file === 'index.ts' || file === 'index.js') continue;

    const filePath = path.join(routesDir, file);
    const routeModule = await import(`file://${filePath}`); // Dynamic import

    // Register the route if it's exported correctly
    if (routeModule.default) {
      fastify.register(routeModule.default);
    } else if (typeof routeModule === 'function') {
      fastify.register(routeModule);
    }
  }
}