import { db } from '@conn';
import { eq } from 'drizzle-orm';
import { movies } from '@database/schema';

import type { MovieEntity } from '@database/seed/seed.type';
import type { Interval, IntervalsResponse } from './intervals.schema';

function normalizeProducers(movie: MovieEntity, producersMap: Map<string, number[]>): void {
  const [beforeAnd, afterAnd] = movie.producers.split(' and ');
  const producers = [
    ...beforeAnd.split(','),
    ...(afterAnd ? [afterAnd] : [])
  ]
    .map((producer) => producer.trim())
    .filter((producer) => producer.length > 0);

  producers.forEach((producer) => {
    if (!producersMap.has(producer)) {
      producersMap.set(producer, []);
    }

    producersMap.get(producer)!.push(movie.year);
  });
}

export class IntervalsService {
  async getIntervals(): Promise<IntervalsResponse> {
    const winnerMovies: MovieEntity[] = await db.select()
      .from(movies)
      .where(eq(movies.winner, true));

    const producersMap = new Map<string, number[]>();

    winnerMovies.forEach((movie) => {
      normalizeProducers(movie, producersMap);
    });

    const intervals: Interval[] = []; 
    
    for (const [producer, years] of producersMap) {
      if (years.length < 2) continue;

      years.sort((a, b) => a - b);

      for (let i = 1; i < years.length; i++) {
        intervals.push({
          producer,
          interval: years[i] - years[i - 1],
          previousWin: years[i - 1],
          followingWin: years[i],
        });
      }
    };

    const { min, max } = intervals.reduce<{ min: Interval[]; max: Interval[]; minVal: number; maxVal: number }>((acc, interval) => {
      if (interval.interval < acc.minVal) {
        acc.minVal = interval.interval;
        acc.min = [interval];
      } else if (interval.interval === acc.minVal) {
        acc.min.push(interval);
      }

      if (interval.interval > acc.maxVal) {
        acc.maxVal = interval.interval;
        acc.max = [interval];
      } else if (interval.interval === acc.maxVal) {
        acc.max.push(interval);
      }

      return acc;
    }, { min: [], max: [], minVal: Infinity, maxVal: -Infinity });

    return { min, max };
  }
}
