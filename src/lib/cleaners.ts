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
    return rows.map((r: any) => ({
      id: String(r.id),
      name: String(r.name),
      phone: r.phone ? String(r.phone) : null,
      email: r.email ? String(r.email) : null,
      reliability_score: Number(r.reliability_score),
      points_balance: Number(r.points_balance),
      is_active: Boolean(r.is_active),
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
    const r = rows[0] as any;
    return {
      id: String(r.id),
      name: String(r.name),
      phone: r.phone ? String(r.phone) : null,
      email: r.email ? String(r.email) : null,
      reliability_score: Number(r.reliability_score),
      points_balance: Number(r.points_balance),
      is_active: Boolean(r.is_active),
      created_at: String(r.created_at),
    };
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

// ── Monthly stats for cleaner tooltips ────────────────────────────

export interface CleanerMonthlyStats {
  total_jobs: number;
  on_time: number;
  no_shows: number;
  on_time_pct: number;
}

export const getCleanerMonthlyStats = createServerFn({ method: "GET" })
  .validator((cleanerId: string) => cleanerId)
  .handler(async ({ data: cleanerId }): Promise<CleanerMonthlyStats | null> => {
    const rows = await sql()`
      SELECT
        COUNT(*)::int AS total_jobs,
        COUNT(*) FILTER (WHERE al.status = 'ontime')::int AS on_time,
        COUNT(*) FILTER (WHERE al.status = 'no_show')::int AS no_shows
      FROM attendance_logs al
      JOIN jobs j ON j.id = al.job_id
      WHERE al.cleaner_id = ${cleanerId}
        AND j.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
    `;
    if (rows.length === 0 || rows[0].total_jobs === 0) return null;
    const r = rows[0];
    return {
      total_jobs: Number(r.total_jobs),
      on_time: Number(r.on_time),
      no_shows: Number(r.no_shows),
      on_time_pct: Math.round((Number(r.on_time) / Number(r.total_jobs)) * 100),
    };
  });

// ── Bulk monthly stats (for cleaner list tooltips) ─────────────────

export const getAllCleanersMonthlyStats = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql()`
    SELECT
      c.id AS cleaner_id,
      COUNT(al.id)::int AS total_jobs,
      COUNT(al.id) FILTER (WHERE al.status = 'ontime')::int AS on_time,
      COUNT(al.id) FILTER (WHERE al.status = 'no_show')::int AS no_shows
    FROM cleaners c
    LEFT JOIN attendance_logs al ON al.cleaner_id = c.id
    LEFT JOIN jobs j ON j.id = al.job_id AND j.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE c.is_active = true
    GROUP BY c.id
  `;
  const result: Record<string, CleanerMonthlyStats> = {};
  for (const r of rows) {
    const total = Number(r.total_jobs);
    result[String(r.cleaner_id)] = {
      total_jobs: total,
      on_time: Number(r.on_time),
      no_shows: Number(r.no_shows),
      on_time_pct: total > 0 ? Math.round((Number(r.on_time) / total) * 100) : 0,
    };
  }
  return result;
});

// ── Toggle cleaner active status ─────────────────────────────────

export const toggleCleanerActive = createServerFn({ method: "POST" })
  .validator((input: { id: string; is_active: boolean }) => input)
  .handler(async ({ data }) => {
    await sql()`UPDATE cleaners SET is_active = ${data.is_active} WHERE id = ${data.id}`;
    return { success: true };
  });
