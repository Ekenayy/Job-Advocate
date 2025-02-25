import { FastifyInstance } from 'fastify';
import { extractJobInfoHandler } from '../handlers/jobinfo.handler';

export async function analyzeRoutes(fastify: FastifyInstance) {
  fastify.post('/analyze/job-page', extractJobInfoHandler);
  fastify.post('/analyze/job-info', extractJobInfoHandler);
}  