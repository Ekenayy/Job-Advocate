import { FastifyInstance } from "fastify";
import { searchEmployeesHandler } from "../handlers/snov.handler";
import {
  snovSearchQuerySchema,
  snovSearchResponseSchema,
} from "../schemas/snov.schema";

export default async function snovRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/snov/search',
    schema: {
      querystring: snovSearchQuerySchema,
      response: {
        200: snovSearchResponseSchema
      }
    },
    handler: searchEmployeesHandler
  });
}
