import { FastifyInstance } from 'fastify';
import { webhookHandler } from '../handlers/auth.handler';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/webhook/clerk', webhookHandler);
}