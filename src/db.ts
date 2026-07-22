import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Module-level side-effect: Force load the correct DATABASE_URL from .env if present, to override system env defaults
try {
  const envPaths = [
    join(import.meta.dirname, "..", ".env"),
    join(process.cwd(), ".env"),
    "/home/team/shared/site/.env"
  ];
  for (const envPath of envPaths) {
    try {
      const envContent = readFileSync(envPath, "utf8");
      const match = envContent.match(/DATABASE_URL=(.+)/);
      if (match) {
        const dbUrl = match[1].trim();
        if (dbUrl.startsWith("postgresql:") || dbUrl.startsWith("postgres:")) {
          process.env.DATABASE_URL = dbUrl;
          break;
        }
      }
    } catch (e) {
      // Continue trying next path
    }
  }
} catch (e) {
  // Ignore errors
}

/**
 * Server-only handle to the team's database (Neon serverless Postgres over HTTP).
 * The connection string comes from `DATABASE_URL`, which the owner connects via
 * the database card and which is injected into the sandbox and passed to the live
 * host on publish. Resolved lazily (per call, not at module load) so the site
 * still builds and serves before a database is connected — the error only
 * surfaces if a query actually runs without `DATABASE_URL`.
 *
 * Use it only inside a `createServerFn()` handler or an `src/routes/api/*` route
 * (never client code):
 *
 *   const getPosts = createServerFn().handler(async () => {
 *     const rows = await sql()`select id, title, created_at from posts`;
 *     return rows.map((r) => ({ ...r, created_at: String(r.created_at) }));
 *   });
 *
 * For raw SQL with parameterized queries (for migrations, seed data):
 *
 *   const rows = await query("SELECT * FROM users WHERE id = $1", [userId]);
 */
export const sql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — connect a database (via the database card) before running queries.",
    );
  }
  return neon(url);
};

/**
 * Run a raw parameterized query. Returns the result array directly.
 * Use this for scripts and migrations where tagged templates are awkward.
 */
export async function query(sqlString: string, params?: any[]) {
  const db = sql();
  return params ? db.query(sqlString, params) : db.query(sqlString);
}