// Add email routes here

import { FastifyInstance } from 'fastify';
import { createEmailHandler, sendEmailHandler } from '../handlers/email.handler';
import { CreateEmailSchema, EmailRequestSchema } from '../schemas/email.schema';

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

    fastify.post(
      '/email/send', 
      {
        schema: {
          body: EmailRequestSchema
        }
      },
      sendEmailHandler
    );
}