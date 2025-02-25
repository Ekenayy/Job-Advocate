import { FastifyInstance } from 'fastify';
import { analyzeJobPageHandler, extractJobInfoHandler } from '../handlers/jobinfo.handler';

export async function analyzeRoutes(fastify: FastifyInstance) {
  fastify.post('/analyze/job-page', analyzeJobPageHandler);
  fastify.post('/analyze/job-info', extractJobInfoHandler);
}