import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { sql } from "../db";

/**
 * Run all pending migrations in src/db/migrations/.
 * Migrations are named 001_<name>.sql, 002_<name>.sql, etc. and run in order.
 * Tracks applied migrations in a `_migrations` table so each runs at most once.
 */
export async function migrate() {
  const client = sql();

  // Ensure the migration tracking table exists
  await client`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  // Read migration files
  const migrationsDir = join(import.meta.dirname, "migrations");
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Determine which have already been applied
  const applied = await client`SELECT name FROM _migrations`;
  const appliedNames = new Set(applied.map((r: any) => r.name));

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(`Skipping (already applied): ${file}`);
      continue;
    }

    console.log(`Applying migration: ${file}`);
    const sqlContent = await readFile(join(migrationsDir, file), "utf8");

    // Remove SQL comments line-by-line first
    const cleanLines = sqlContent.split("\n").map((line) => {
      const idx = line.indexOf("--");
      return idx >= 0 ? line.slice(0, idx) : line;
    });
    const cleanSql = cleanLines.join("\n");

    // Split by semicolons and trim
    const statements = cleanSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Run each statement individually
    for (const stmt of statements) {
      await client.unsafe(stmt);
    }

    // Record the migration as applied
    await client`INSERT INTO _migrations (name) VALUES (${file})`;
    console.log(`  ✓ ${file} applied`);
  }

  console.log("Migrations complete.");
}

// Allow running directly: bun run src/db/migrate.ts
if (import.meta.main) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
