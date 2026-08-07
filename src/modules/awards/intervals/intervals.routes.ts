import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getIntervals } from './intervals.controller';
import { intervalsResponseSchema } from './intervals.schema';

export async function intervalsRoutes(app: FastifyInstance): Promise<void> {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/intervals',
    handler: getIntervals,
    schema: {
      tags: ['Awards'],
      response: {
        200: intervalsResponseSchema,
      },
    },
  });
}
