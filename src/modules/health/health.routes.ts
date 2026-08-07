import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getHealth } from './health.controller';
import { healthResponseSchema } from './health.schema';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/health',
    handler: getHealth,
    schema: {
      tags: ['Health'],
      summary: 'Get API health status',
      response: {
        200: healthResponseSchema,
      },
    },
  });
}
