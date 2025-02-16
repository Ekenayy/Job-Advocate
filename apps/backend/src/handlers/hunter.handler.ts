import { FastifyRequest, FastifyReply } from 'fastify';
import { searchDomainEmployees } from '../services/hunterService';

export const searchEmployeesHandler = async (
  request: FastifyRequest<{
    Querystring: { domain: string; jobTitle: string }
  }>,
  reply: FastifyReply
) => {
  try {
    const { domain, jobTitle } = request.query;
    const employees = await searchDomainEmployees(domain, jobTitle);
    return reply.status(200).send(employees);
  } catch (error) {
    console.error('Error in searchEmployeesHandler:', error);
    return reply.status(500).send({ error: 'Failed to fetch employees' });
  }
};