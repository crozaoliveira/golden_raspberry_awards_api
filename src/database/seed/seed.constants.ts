import { join } from 'node:path';
import { getTableColumns } from 'drizzle-orm';
import { movies } from '../schema';

export const CSV_DELIMITER = ';';
export const INGESTION_DIR = join(__dirname, '..', '..', 'data', 'ingestion');

export const EXPECTED_COLUMNS = Object.values(getTableColumns(movies))
  .map((column) => column.name)
  .filter((name) => name !== 'id');