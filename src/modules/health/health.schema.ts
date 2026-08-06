import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number().describe('Process uptime in seconds'),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
