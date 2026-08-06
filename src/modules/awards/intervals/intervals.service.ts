import type { IntervalsResponse } from './intervals.schema';

export class IntervalsService {
  async getIntervals(): Promise<IntervalsResponse> {
    // TODO: replace with the real calculation, based on the `movies` table
    return {
      min: [
        { producer: 'Producer 1', interval: 1, previousWin: 2008, followingWin: 2009 },
        { producer: 'Producer 2', interval: 1, previousWin: 2018, followingWin: 2019 },
      ],
      max: [
        { producer: 'Producer 1', interval: 99, previousWin: 1900, followingWin: 1999 },
        { producer: 'Producer 2', interval: 99, previousWin: 2000, followingWin: 2099 },
      ],
    };
  }
}
