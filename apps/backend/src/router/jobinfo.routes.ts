import { FastifyInstance } from 'fastify';
import { extractJobInfoHandler } from '../handlers/jobinfo.handler';
import { jobInfoRequestSchema, jobInfoResponseSchema } from '../schemas/jobInfo.schema';

export default async function jobInfoRoutes(fastify: FastifyInstance) {
  // Single endpoint for extracting job info
  fastify.route({
    method: 'POST',
    url: '/analyze/job-info',
    schema: {
      description: 'Extract job title and company domain from job page content',
      tags: ['Job Analysis'],
      body: jobInfoRequestSchema,
      response: {
        200: jobInfoResponseSchema
      }
    },
    handler: extractJobInfoHandler
  });
}