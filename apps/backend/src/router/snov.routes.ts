import { FastifyInstance } from "fastify";
import { searchEmployeesHandler } from "../handlers/snov.handler";
import {
  snovSearchQuerySchema,
  snovSearchResponseSchema,
} from "../schemas/snov.schema";

export default async function snovRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: 'POST',
    url: '/snov/search',
    schema: {
      body: snovSearchQuerySchema,
      response: {
        200: snovSearchResponseSchema
      }
    },
    handler: searchEmployeesHandler
  });
}
