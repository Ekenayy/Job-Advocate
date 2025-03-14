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
    
    console.log(`Searching for employees with domain: ${domain}, jobTitle: ${jobTitle}`);
    
    if (!domain || !jobTitle) {
      console.log('Missing required parameters');
      return reply.status(400).send({ 
        error: 'Missing required parameters',
        details: 'Both domain and jobTitle are required to search for employees',
        code: 'MISSING_PARAMETERS'
      });
    }

    try {
      const employees = await searchDomainEmployees(domain, jobTitle, potentialAdvocates);
      
      if (!employees || employees.length === 0) {
        console.log(`No employees found for ${domain} with job title "${jobTitle}"`);
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
      console.error('Snov.io service error:', snovError.message);
      
      // Handle specific Snov.io error cases
      if (snovError.message?.includes('access token')) {
        console.log('Authentication error with Snov.io');
        return reply.status(401).send({
          error: 'API authentication failed',
          details: 'We couldn\'t authenticate with our employee search service',
          code: 'AUTH_FAILED'
        });
      } else if (snovError.message?.includes('domain search timed out')) {
        console.log('Search timeout error with Snov.io');
        return reply.status(408).send({
          error: 'Search timed out',
          details: 'The employee search took too long to complete',
          suggestions: ['Try again later when our services are less busy'],
          code: 'SEARCH_TIMEOUT'
        });
      } else if (snovError.message?.includes('No valid employees found')) {
        console.log('No valid employees found error with Snov.io');
        return reply.status(404).send({
          error: 'No valid employee data',
          details: 'We found some employees but couldn\'t retrieve their contact information',
          suggestions: [
            'Try a different job title',
            'Check if the company domain is correct',
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
    
    // Check if the error message contains "No valid employees found"
    if (error instanceof Error && error.message.includes('No valid employees found')) {
      console.log('Catching No valid employees found error in general handler');
      return reply.status(404).send({
        error: 'No valid employee data',
        details: 'We found some employees but couldn\'t retrieve their contact information',
        suggestions: [
          'Try a different job title',
          'Check if the company domain is correct',
          'The company may have restricted employee information'
        ],
        code: 'NO_VALID_EMPLOYEES'
      });
    }
    
    return reply.status(500).send({ 
      error: 'Service error',
      details: 'We encountered an unexpected error while searching for employees',
      code: 'SERVICE_ERROR'
    });
  }
};