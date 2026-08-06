import type { HealthResponse } from './health.schema';

export class HealthService {
  getStatus(): HealthResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
