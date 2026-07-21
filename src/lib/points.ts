import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Types ────────────────────────────────────────────────────────

export interface PointsTransaction {
  id: string;
  cleaner_id: string;
  points: number;
  reason: string;
  reference_job_id: string | null;
  created_at: string;
  cleaner_name?: string;
  job_title?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  reliability_score: number;
  points_balance: number;
  on_time_count: number;
  backup_count: number;
  no_show_count: number;
}

// ── Get leaderboard ──────────────────────────────────────────────

export const getLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeaderboardEntry[]> => {
    const rows = await sql()`
      SELECT
        c.id,
        c.name,
        c.reliability_score,
        c.points_balance,
        COUNT(pt.id) FILTER (WHERE pt.reason = 'on_time')::int AS on_time_count,
        COUNT(pt.id) FILTER (WHERE pt.reason = 'backup_shift')::int AS backup_count,
        COUNT(pt.id) FILTER (WHERE pt.reason = 'no_show')::int AS no_show_count
      FROM cleaners c
      LEFT JOIN points_transactions pt ON pt.cleaner_id = c.id
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.reliability_score, c.points_balance
      ORDER BY c.points_balance DESC
    `;
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      reliability_score: Number(r.reliability_score),
      points_balance: Number(r.points_balance),
      on_time_count: Number(r.on_time_count),
      backup_count: Number(r.backup_count),
      no_show_count: Number(r.no_show_count),
    }));
  }
);

// ── Get cleaner points history ───────────────────────────────────

export const getCleanerPointsHistory = createServerFn({ method: "GET" })
  .validator((cleanerId: string) => cleanerId)
  .handler(async ({ data: cleanerId }): Promise<PointsTransaction[]> => {
    const rows = await sql()`
      SELECT pt.*, c.name AS cleaner_name, j.title AS job_title
      FROM points_transactions pt
      JOIN cleaners c ON c.id = pt.cleaner_id
      LEFT JOIN jobs j ON j.id = pt.reference_job_id
      WHERE pt.cleaner_id = ${cleanerId}
      ORDER BY pt.created_at DESC
      LIMIT 50
    `;
    return rows.map((r) => ({
      id: String(r.id),
      cleaner_id: String(r.cleaner_id),
      points: Number(r.points),
      reason: String(r.reason),
      reference_job_id: r.reference_job_id ? String(r.reference_job_id) : null,
      created_at: String(r.created_at),
      cleaner_name: r.cleaner_name ? String(r.cleaner_name) : undefined,
      job_title: r.job_title ? String(r.job_title) : undefined,
    }));
  });

// ── Get ranked cleaners (for priority scheduling) ────────────────

export const getRankedCleaners = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql()`
    SELECT id, name, reliability_score, points_balance
    FROM cleaners
    WHERE is_active = true
    ORDER BY points_balance DESC
  `;
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    reliability_score: Number(r.reliability_score),
    points_balance: Number(r.points_balance),
  }));
});
