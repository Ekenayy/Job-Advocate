// import { FastifyInstance } from 'fastify';
// import { searchEmployeesHandler } from '../handlers/hunter.handler';
// import { hunterSearchQuerySchema, hunterSearchResponseSchema } from '../schemas/hunter.schema';

// export default async function hunterRoutes(fastify: FastifyInstance) {
//   fastify.get('/hunter/search', {
//     schema: {
//       querystring: hunterSearchQuerySchema,
//       response: {
//         200: hunterSearchResponseSchema
//       }
//     },
//     handler: searchEmployeesHandler
//   });
// }