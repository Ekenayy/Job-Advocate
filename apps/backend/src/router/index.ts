import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';

export default async function registerRoutes(fastify: FastifyInstance) {
  const routesDir = __dirname;
  const files = fs.readdirSync(routesDir);

  for (const file of files) {
    if (file === 'index.ts' || file === 'index.js') continue;

    const routeModule = require(path.join(routesDir, file));
    const plugin = routeModule.default || routeModule;
    
    if (typeof plugin === 'function') {
      fastify.register(plugin);
    }
  }
}