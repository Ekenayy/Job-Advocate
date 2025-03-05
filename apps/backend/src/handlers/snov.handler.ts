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
        error: 'Missing required parameters',
        details: 'Both domain and jobTitle are required to search for employees',
        code: 'MISSING_PARAMETERS'
      });
    }

    try {
      const employees = await searchDomainEmployees(domain, jobTitle, potentialAdvocates);
      
      if (!employees || employees.length === 0) {
        return reply.status(404).send({ 
          error: 'No employees found',
          details: `We couldn't find any employees matching "${jobTitle}" at ${domain}`,
          suggestions: [
            'Try a more general job title',
            'Check if the company domain is correct',
            'Try searching for executives (CEO, CTO, etc.)'
          ],
          code: 'NO_EMPLOYEES_FOUND'
        });
      }
      
      console.log(`Found ${employees.length} employees for ${domain} with job title "${jobTitle}"`);
      return reply.send(employees);
      
    } catch (snovError: any) {
      // Handle specific Snov.io error cases
      if (snovError.message?.includes('access token')) {
        return reply.status(401).send({
          error: 'API authentication failed',
          details: 'We couldn\'t authenticate with our employee search service',
          code: 'AUTH_FAILED'
        });
      } else if (snovError.message?.includes('domain search timed out')) {
        return reply.status(408).send({
          error: 'Search timed out',
          details: 'The employee search took too long to complete',
          suggestions: ['Try again later when our services are less busy'],
          code: 'SEARCH_TIMEOUT'
        });
      } else if (snovError.message?.includes('No valid employees found')) {
        return reply.status(404).send({
          error: 'No valid employee data',
          details: 'We found some employees but couldn\'t retrieve their contact information',
          suggestions: [
            'Try a different job title',
            'The company may have restricted employee information'
          ],
          code: 'NO_VALID_EMPLOYEES'
        });
      }
      
      // Re-throw for general error handling
      throw snovError;
    }
  } catch (error) {
    console.error('Detailed error in searchEmployeesHandler:', error);
    
    return reply.status(500).send({ 
      error: 'Service error',
      details: 'We encountered an unexpected error while searching for employees',
      code: 'SERVICE_ERROR'
    });
  }
};