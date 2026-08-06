import type { FastifyReply, FastifyRequest } from 'fastify';
import { IntervalsService } from './intervals.service';

const intervalsService = new IntervalsService();

export async function getIntervals(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const intervals = await intervalsService.getIntervals();
  reply.status(200).send(intervals);
}
