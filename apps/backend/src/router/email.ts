import { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from '@sinclair/typebox';
import { sendEmail } from '../services/emailService';
import { EmailRequest } from '../types/email';

// Define schemas for request validation
const UserInfoSchema = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  role: Type.String()
});

const AdvocateInfoSchema = Type.Object({
  first_name: Type.String(),
  last_name: Type.String(),
  email: Type.String({ format: 'email' }),
  company: Type.String(),
  role: Type.String()
});

const EmailContentSchema = Type.Object({
  subject: Type.String(),
  body: Type.String()
});

const EmailRequestSchema = Type.Object({
  from: UserInfoSchema,
  to: AdvocateInfoSchema,
  content: EmailContentSchema
});

export default async function emailRoutes(fastify: FastifyInstance) {
  fastify.post('/api/email/send', {
    schema: {
      body: EmailRequestSchema
    },
    handler: async (
      request: FastifyRequest<{
        Body: EmailRequest
      }>,
      reply
    ) => {
      try {
        const result = await sendEmail(request.body);
        
        if (!result.success) {
          return reply.status(400).send(result);
        }
        
        return reply.status(200).send(result);
      } catch (error) {
        return reply.status(500).send({ 
          success: false, 
          error: 'Internal server error' 
        });
      }
    }
  });
}
