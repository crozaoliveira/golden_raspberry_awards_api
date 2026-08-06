export interface MovieRow {
  year: number;
  title: string | null;
  studios: string | null;
  producers: string;
  winner: boolean;
}

export interface MovieEntity extends MovieRow {
  id: number;
}

export type CsvRecord = Record<string, string>;