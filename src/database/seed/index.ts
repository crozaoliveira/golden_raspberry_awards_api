import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';
import { sql } from "drizzle-orm/sql/sql";
import { db } from '../conn';
import { movies } from '../schema';
import { AppError } from '../../shared/errors/app-error';
import { INGESTION_DIR, CSV_DELIMITER, EXPECTED_COLUMNS } from './seed.constants';
import type { MovieRow, CsvRecord } from './seed.type';

function createMovieTable(): void {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY,
        year INTEGER,
        title TEXT,
        studios TEXT,
        producers TEXT,
        winner INTEGER DEFAULT 0
    )`
  );
}


function contractError(fileName: string): MovieRow[] {
  console.error(`O arquivo "${fileName}" não possui a estrutura contratada.`, 500);
  return [];
}

function listCsvFiles(directory: string): string[] {
  let entries: string[];

  try {
    entries = readdirSync(directory);
  } catch {
    throw new AppError('Não existem arquivos para ingestão.', 500);
  }

  const csvFiles = entries.filter((entry) => entry.toLowerCase().endsWith('.csv'));

  if (csvFiles.length === 0) {
    throw new AppError('Não existem arquivos para ingestão.', 500);
  }

  return csvFiles.map((file) => join(directory, file));
}

function assertValidStructure(columns: string[]): boolean {
  return columns.length === EXPECTED_COLUMNS.length &&
    EXPECTED_COLUMNS.every((expected, index) => columns[index] === expected);
}

function parseCsvFile(filePath: string): MovieRow[] {
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
  const content = readFileSync(filePath, 'utf-8');

  let records: CsvRecord[];

  try {
    records = parse(content, {
      delimiter: CSV_DELIMITER,
      columns: (header: string[]) => header.map((column) => column.trim().toLowerCase()),
      trim: true,
      skip_empty_lines: true,
    });
  } catch {
    return contractError(fileName);
  }

  if (records.length === 0) {
    return contractError(fileName);
  }

  if (!assertValidStructure(Object.keys(records[0]))) {
    return contractError(fileName);
  }

  return records.map((record) => ({
    year: record.year ? parseInt(record.year, 10) : undefined,
    title: record.title,
    studios: record.studios,
    producers: record.producers,
    winner: record.winner === 'yes' || record.winner === 'true',
  }));
}

export function seedDatabase(): void {
  const csvFilePaths = listCsvFiles(INGESTION_DIR);
  const rows = csvFilePaths.flatMap(parseCsvFile);

  if (rows.length === 0) {
    throw new AppError('Não existem arquivos para montar o banco de dados.', 500);
  }

  createMovieTable();
  db.insert(movies).values(rows).run();
}
