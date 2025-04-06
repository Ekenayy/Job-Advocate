import { FastifyInstance } from "fastify";
import { searchEmployeesHandler, getCompanyDomainHandler } from "../handlers/snov.handler";
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

  fastify.route({
    method: 'POST',
    url: '/snov/domain',
    schema: {
      body: {
        type: "object",
        required: ["names"],
        properties: {
          names: { type: "array", items: { type: "string" } },
        },
      },
    },
    handler: getCompanyDomainHandler
  });
}
