import { FastifyInstance } from 'fastify';
import { resumeHandler, getResumeHandler } from '../handlers/resume.handler';
import { Type } from '@sinclair/typebox';

export default async function resumeRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/resume', 
    {
      schema: {
        consumes: ['multipart/form-data'],
        produces: ['application/json'],
        summary: 'Upload or update user resume',
        description: 'Create or update user resume with optional update flag',
      }
    },
    resumeHandler
  );
  
  fastify.get(
    '/resume/:userId',
    {
      schema: {
        params: Type.Object({
          userId: Type.String()
        }),
        response: {
          200: Type.Object({
            id: Type.Number(),
            user_id: Type.String(),
            parsed_data: Type.Object({}),
            raw_text: Type.String(),
            created_at: Type.String(),
            updated_at: Type.Optional(Type.String())
          })
        }
      }
    },
    getResumeHandler
  );
}