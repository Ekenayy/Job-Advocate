import { FastifyRequest, FastifyReply } from 'fastify';
import { searchDomainEmployees } from '../services/snovService';
import { snovSearchQuerySchemaType } from '../schemas/snov.schema';

export const searchEmployeesHandler = async (
  request: FastifyRequest<{
    Body: snovSearchQuerySchemaType
  }>,
  reply: FastifyReply
) => {
  try {
    const { domain, jobTitle, potentialAdvocates = [] } = request.body;
    
    if (!domain || !jobTitle) {
      return reply.status(400).send({ 
        error: 'Missing required query parameters: domain and jobTitle' 
      });
    }

    const employees = await searchDomainEmployees(domain, jobTitle, potentialAdvocates);
    
    if (!employees || employees.length === 0) {
      return reply.status(404).send({ 
        message: 'No employees found for the given domain and job title' 
      });
    }

    // Let's add some debugging here
    console.log('Employee data structure:', JSON.stringify(employees[0], null, 2));
    
    return reply.send(employees); // Try without status(200)
  } catch (error) {
    console.error('Detailed error in searchEmployeesHandler:', error);
    
    // Check if error is from Snov.io API
    if (error instanceof Error) {
      if (error.message.includes('Failed to get Snov.io access token')) {
        return reply.status(401).send({ error: 'Authentication failed with Snov.io API' });
      }
      return reply.status(500).send({ error: error.message });
    }
    
    return reply.status(500).send({ error: 'Failed to fetch employees' });
  }
};