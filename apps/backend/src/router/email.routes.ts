// Add email routes here

import { FastifyInstance } from 'fastify';
import { createEmailHandler } from '../handlers/email.handler';
import { CreateEmailSchema, GenerateAIEmailSchema } from '../schemas/email.schema';
import { generateEmailHandler, getEmailsHandler } from '../handlers/email.handler';
import { Type } from '@sinclair/typebox';

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
    fastify.get(
      '/email/:user_id',
      {
        schema: {
          params: Type.Object({
            user_id: Type.String()
          })
        }
      },
      getEmailsHandler
    );
}