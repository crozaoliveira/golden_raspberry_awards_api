import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '@/app';
import { loadEnv } from '@/config/env';
import { db, sqlite } from '@conn';
import { movies } from '@database/schema';
import type { IntervalsResponse } from './intervals.schema';

const ENDPOINT = '/api/v1/awards/intervals';

interface SeedMovie {
  year: number;
  producers: string;
  winner: boolean;
}

function seedMovies(rows: SeedMovie[]): void {
  db.insert(movies).values(rows).run();
}

describe('GET /api/v1/awards/intervals', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY,
        year INTEGER NOT NULL,
        title TEXT,
        studios TEXT,
        producers TEXT NOT NULL,
        winner INTEGER DEFAULT 0
      )
    `);

    app = await buildApp(loadEnv({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }));
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    sqlite.close();
  });

  beforeEach(() => {
    sqlite.exec('DELETE FROM movies');
  });

  it('Retorna arrays de min/max vazios quando não há filmes vencedores', async () => {
    const response = await app.inject({ method: 'GET', url: ENDPOINT });

    expect(response.statusCode).toBe(200);
    expect(response.json<IntervalsResponse>()).toEqual({ min: [], max: [] });
  });

  it('Ignora produtores que venceram apenas uma vez e filmes que não venceram', async () => {
    seedMovies([
      { year: 2000, producers: 'Not A Winner', winner: false },
      { year: 2005, producers: 'Not A Winner', winner: false },
      { year: 2010, producers: 'One Time Winner', winner: true },
    ]);

    const response = await app.inject({ method: 'GET', url: ENDPOINT });

    expect(response.statusCode).toBe(200);
    expect(response.json<IntervalsResponse>()).toEqual({ min: [], max: [] });
  });

  it('Identifica o produtor com menor e com maior intervalo entre vitórias', async () => {
    seedMovies([
      { year: 2000, producers: 'Alice Min', winner: true },
      { year: 2001, producers:'Alice Min', winner: true },
      { year: 1990, producers: 'Bob Max', winner: true },
      { year: 2000, producers: 'Bob Max', winner: true },
    ]);

    const response = await app.inject({ method: 'GET', url: ENDPOINT });

    expect(response.statusCode).toBe(200);
    expect(response.json<IntervalsResponse>()).toEqual({
      min: [{ producer: 'Alice Min', interval: 1, previousWin: 2000, followingWin: 2001 }],
      max: [{ producer: 'Bob Max', interval: 10, previousWin: 1990, followingWin: 2000 }],
    });
  });

  it('Retorna todos os produtores empatados com menor ou maior intervalo', async () => {
    seedMovies([
      { year: 2000, producers: 'Alice Min', winner: true },
      { year: 2001, producers: 'Alice Min', winner: true },
      { year: 2010, producers: 'Carol Min', winner: true },
      { year: 2011, producers: 'Carol Min', winner: true },
      { year: 1990, producers: 'Bob Max', winner: true },
      { year: 2000, producers: 'Bob Max', winner: true },
    ]);

    const response = await app.inject({ method: 'GET', url: ENDPOINT });
    const body = response.json<IntervalsResponse>();

    expect(body.min).toHaveLength(2);
    expect(body.min.map((entry) => entry.producer).sort()).toEqual(['Alice Min', 'Carol Min']);
    expect(body.max).toEqual([
      { producer: 'Bob Max', interval: 10, previousWin: 1990, followingWin: 2000 },
    ]);
  });

  it('Produz um intervalo por par consecutivo de vitórias para produtores com três ou mais vitórias', async () => {
    seedMovies([
      { year: 1990, producers: 'Quadriple Winner', winner: true },
      { year: 1993, producers: 'Quadriple Winner', winner: true },
      { year: 1994, producers: 'Quadriple Winner', winner: true },
      { year: 2005, producers: 'Quadriple Winner', winner: true },
    ]);

    const response = await app.inject({ method: 'GET', url: ENDPOINT });

    expect(response.statusCode).toBe(200);
    expect(response.json<IntervalsResponse>()).toEqual({
      min: [{ producer: 'Quadriple Winner', interval: 1, previousWin: 1993, followingWin: 1994 }],
      max: [{ producer: 'Quadriple Winner', interval: 11, previousWin: 1994, followingWin: 2005 }],
    });
  });

  it('Divide créditos de produção separados por vírgulas e pela palavra "and", e separa cada um individualmente', async () => {
    seedMovies([
      { year: 2010, producers: 'Producer One, Producer Two and Producer Three', winner: true },
      { year: 2012, producers: 'Producer One', winner: true },
      { year: 2013, producers: 'Producer Two', winner: true },
    ]);

    const response = await app.inject({ method: 'GET', url: ENDPOINT });
    const body = response.json<IntervalsResponse>();

    expect(body.min).toEqual([
      { producer: 'Producer One', interval: 2, previousWin: 2010, followingWin: 2012 },
    ]);
    expect(body.max).toEqual([
      { producer: 'Producer Two', interval: 3, previousWin: 2010, followingWin: 2013 },
    ]);

    const allProducers = [...body.min, ...body.max].map((entry) => entry.producer);
    expect(allProducers).not.toContain('Producer Three');
  });

  it('Retorna erro 500 quando ocorre algum problema no banco de dados', async () => {
    sqlite.exec('DROP TABLE movies');

    const response = await app.inject({ method: 'GET', url: ENDPOINT });

    expect(response.statusCode).toBe(500);
  });
});
