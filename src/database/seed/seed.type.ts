export interface MovieRow {
  year?: number;
  title?: string;
  studios?: string;
  producers?: string;
  winner?: boolean;
}

export type CsvRecord = Record<string, string>;