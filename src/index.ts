import { buildApp } from './app';
import { loadEnv } from './config/env';
import { seedDatabase } from './database/seed';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp(env);

  try {
    seedDatabase();
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void bootstrap();
