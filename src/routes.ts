import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './modules/health/health.routes';
import { awardsRoutes } from './modules/awards/awards.routes';

const prefix = '/api/v1';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.register(healthRoutes, { prefix });
  app.register(awardsRoutes, { prefix });
}
