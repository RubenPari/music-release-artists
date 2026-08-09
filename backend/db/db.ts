import { readFileSync } from "node:fs";
import { Pool, type QueryResultRow } from "pg";
import { config } from "../lib/config";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const ca =
      config.databaseSslCa() ||
      (config.databaseSslCaPath()
        ? readFileSync(config.databaseSslCaPath(), "utf8")
        : "");
    const connectionString = config.databaseUrl();
    pool = new Pool({
      connectionString: ca ? withoutSslMode(connectionString) : connectionString,
      max: config.databasePoolMax(),
      ...(ca
        ? {
            ssl: {
              ca,
              rejectUnauthorized: true,
            },
          }
        : {}),
    });
  }
  return pool;
}

function withoutSslMode(connectionString: string): string {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return url.toString();
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  const activePool = pool;
  pool = null;
  await activePool.end();
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function exec(text: string, params?: unknown[]): Promise<void> {
  await getPool().query(text, params);
}
