import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartValue } from '@fastify/multipart';

interface MultipartFields {
  resume: MultipartValue<string>;
}

export const resumeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = await request.body as MultipartFields;
  const file = await request.file({limits: {fileSize: 10_000_000}}); // 10MB
  
  try {
    // Handle file upload and job title
    // Store in your database/storage
    console.log('file:', file);
    console.log('data:', data);
    return reply.status(200).send({ success: true });
  } catch (error) {
    console.error('Error handling onboarding:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};