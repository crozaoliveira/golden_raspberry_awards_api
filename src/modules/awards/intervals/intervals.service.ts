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

    const intervals: Interval[] = Array.from(producersMap.entries()).flatMap(([producer, years]) => {
      if(years.length < 2) return [];

      years.sort((a, b) => a - b);

      return years.slice(1).map((year, index) => ({
        producer,
        interval: year - years[index],
        previousWin: years[index],
        followingWin: year,
      }));
    });

    const minInterval = Math.min(...intervals.map((i) => i.interval));
    const maxInterval = Math.max(...intervals.map((i) => i.interval));

    return {
      min: [
        ...intervals.filter((i) => i.interval === minInterval)
      ],
      max: [
        ...intervals.filter((i) => i.interval === maxInterval)
      ],
    };
  }
}
