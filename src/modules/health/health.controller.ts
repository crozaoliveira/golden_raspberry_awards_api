import type { FastifyReply, FastifyRequest } from 'fastify';
import { HealthService } from './health.service';

const healthService = new HealthService();

export async function getHealth(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const health = healthService.getStatus();
  reply.status(200).send(health);
}
