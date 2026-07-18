import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec, getPool, query } from "./db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function migrate(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const dir = path.join(__dirname, "migrations");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".up.sql"))
    .sort();

  const applied = await query<{ version: string }>(
    `SELECT version FROM schema_migrations`,
  );
  const appliedSet = new Set(applied.map((r) => r.version));

  for (const file of files) {
    const version = file.replace(/\.up\.sql$/, "");
    if (appliedSet.has(version)) continue;

    const sql = await readFile(path.join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO schema_migrations (version) VALUES ($1)`,
        [version],
      );
      await client.query("COMMIT");
      console.log(`Applied migration ${version}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
