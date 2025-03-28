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
fastify.register(import('fastify-raw-body'), {
  field: 'rawBody', 
  global: false, 
  encoding: 'utf8', 
  runFirst: true, 
  routes: ['/api/stripe/webhook'], 
})
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok' };
});

fastify.get('/', async (request, reply) => {
  return { message: 'Hello, there from InReach app!' };
});  

const start = async () => {
  await registerRoutes(fastify);

  try {
      await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
      fastify.log.error(err);
      process.exit(1);
  }
};

start();