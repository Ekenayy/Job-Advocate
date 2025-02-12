import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function swaggerSetup(fastify: FastifyInstance) {
  await fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'Job Advocate API Docs',
        description: 'API documentation for my Fastify project',
        version: '1.0.0',
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here',
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

    await fastify.register(fastifySwaggerUi, {
        routePrefix: '/docs', // This is the correct way to expose the Swagger UI
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
        },
    });
}