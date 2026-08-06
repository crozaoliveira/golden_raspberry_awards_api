import { z } from 'zod';

const intervalSchema = z.object({
  producer: z.string(),
  interval: z.number().int(),
  previousWin: z.number().int(),
  followingWin: z.number().int(),
});

export const intervalsResponseSchema = z.object({
  min: z.array(intervalSchema),
  max: z.array(intervalSchema),
});

export type Interval = z.infer<typeof intervalSchema>;
export type IntervalsResponse = z.infer<typeof intervalsResponseSchema>;
