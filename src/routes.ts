import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './modules/health/health.routes';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.register(healthRoutes, { prefix: '/api/v1' });
}
