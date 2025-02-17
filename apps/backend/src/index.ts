import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import registerRoutes from './router';
import { swaggerSetup } from './middleware/swagger';
import multipart from '@fastify/multipart';

const fastify = Fastify({
  logger: true,
});

swaggerSetup(fastify);
fastify.register(cors, { origin: '*' });
fastify.register(helmet);
fastify.register(multipart);

await registerRoutes(fastify);

fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok' };
});

fastify.get('/', async (request, reply) => {
  return { message: 'Hello, there from the new job advocate app!' };
});  

const start = async () => {
  try {
      await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
      fastify.log.error(err);
      process.exit(1);
  }
};

start();