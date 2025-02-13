import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import registerRoutes from './router';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
// import { swaggerSetup } from './middleware/swagger';

const fastify = Fastify({
  logger: true,
});

swaggerSetup(fastify);
fastify.register(cors, { origin: '*' });
fastify.register(helmet);

// Register Swagger
await fastify.register(swagger, {
  swagger: {
    info: {
      title: 'Job Advocate Email API',
      description: 'Job Advocate API documentation',
      version: '0.0.1'
    },
  }
});

// Register Swagger UI
await fastify.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
});

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