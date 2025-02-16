import { FastifyInstance } from 'fastify';
import { resumeHandler } from '../handlers/resume.handler';
import { OnboardingProfileSchema } from '../schemas/onboarding.schema';

export default async function resumeRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/resume', 
    {
      schema: {
        consumes: ['multipart/form-data'],
        produces: ['application/json'],
        summary: 'Upload user profile and resume',
        description: 'Create user profile with job title and optional resume upload',
      }
    },
    resumeHandler
  );
}