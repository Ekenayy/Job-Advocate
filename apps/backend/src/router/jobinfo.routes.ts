import { FastifyInstance } from 'fastify';
import { extractJobInfoHandler } from '../handlers/jobinfo.handler';
import { Type } from '@sinclair/typebox';

// Define schemas for request and response
const jobInfoRequestSchema = Type.Object({
  pageContent: Type.String({
    description: 'The content of the job page to analyze'
  })
});

const jobInfoResponseSchema = Type.Object({
  jobTitle: Type.String({
    description: 'The extracted job title'
  }),
  companyDomain: Type.String({
    description: 'The extracted company domain'
  })
});

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