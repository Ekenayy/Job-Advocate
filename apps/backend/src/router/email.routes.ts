// Add email routes here

import { FastifyInstance } from 'fastify';
import { createEmailHandler } from '../handlers/email.handler';
import { CreateEmailSchema, GenerateAIEmailSchema } from '../schemas/email.schema';
import { generateEmailHandler } from '../handlers/email.handler';
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
      '/email/generate', 
      {
        schema: {
          body: GenerateAIEmailSchema
        }
      },
      generateEmailHandler
    );
}