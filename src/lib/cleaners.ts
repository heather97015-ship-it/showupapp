import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Types ────────────────────────────────────────────────────────

export interface Cleaner {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  reliability_score: number;
  points_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface CleanerInput {
  name: string;
  phone?: string;
  email?: string;
}

// ── List all cleaners ────────────────────────────────────────────

export const listCleaners = createServerFn({ method: "GET" }).handler(
  async (): Promise<Cleaner[]> => {
    const rows = await sql()`SELECT * FROM cleaners ORDER BY name`;
    return rows.map((r) => ({
      ...r,
      created_at: String(r.created_at),
    }));
  }
);

// ── Get single cleaner ───────────────────────────────────────────

export const getCleaner = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<Cleaner | null> => {
    const rows = await sql()`SELECT * FROM cleaners WHERE id = ${id}`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return { ...r, created_at: String(r.created_at) };
  });

// ── Create cleaner ───────────────────────────────────────────────

export const createCleaner = createServerFn({ method: "POST" })
  .validator((input: CleanerInput) => input)
  .handler(async ({ data }) => {
    const rows = await sql()`
      INSERT INTO cleaners (name, phone, email)
      VALUES (${data.name}, ${data.phone ?? null}, ${data.email ?? null})
      RETURNING *
    `;
    const r = rows[0];
    return { ...r, created_at: String(r.created_at) } as Cleaner;
  });

// ── Update cleaner ───────────────────────────────────────────────

export const updateCleaner = createServerFn({ method: "POST" })
  .validator(
    (input: { id: string; name: string; phone?: string; email?: string; is_active?: boolean }) =>
      input
  )
  .handler(async ({ data }) => {
    const rows = await sql()`
      UPDATE cleaners
      SET name = ${data.name},
          phone = ${data.phone ?? null},
          email = ${data.email ?? null},
          is_active = ${data.is_active ?? true}
      WHERE id = ${data.id}
      RETURNING *
    `;
    if (rows.length === 0) throw new Error("Cleaner not found");
    const r = rows[0];
    return { ...r, created_at: String(r.created_at) } as Cleaner;
  });

// ── Toggle cleaner active status ─────────────────────────────────

export const toggleCleanerActive = createServerFn({ method: "POST" })
  .validator((input: { id: string; is_active: boolean }) => input)
  .handler(async ({ data }) => {
    await sql()`UPDATE cleaners SET is_active = ${data.is_active} WHERE id = ${data.id}`;
    return { success: true };
  });
