import type { FastifyInstance } from 'fastify';
import { intervalsRoutes } from './intervals/intervals.routes';

export async function awardsRoutes(app: FastifyInstance): Promise<void> {
  await app.register(intervalsRoutes, { prefix: '/awards' });
}
