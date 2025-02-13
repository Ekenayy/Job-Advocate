// Add email routes here

import { FastifyInstance } from 'fastify';
import { createEmailHandler } from '../handlers/email.handler';
import { CreateEmailSchema } from '../schemas/email.schema';

export default async function emailRoutes(fastify: FastifyInstance) {
    fastify.post(
      '/email', 
      {
        schema: {
          body: CreateEmailSchema
        }
      },
      createEmailHandler
    );
}