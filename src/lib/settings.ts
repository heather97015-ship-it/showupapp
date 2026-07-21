import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Types ────────────────────────────────────────────────────────

export interface OwnerSettings {
  id: string;
  business_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  backup_auto_deploy: boolean;
  points_per_on_time: number;
  points_per_backup: number;
  penalty_for_no_show: number;
  created_at: string;
  updated_at: string;
}

// ── Get settings ─────────────────────────────────────────────────

export const getSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<OwnerSettings> => {
    const rows = await sql()`SELECT * FROM owner_settings LIMIT 1`;
    if (rows.length === 0) {
      // Create default
      const inserted = await sql()`
        INSERT INTO owner_settings (business_name) VALUES ('ShowUp') RETURNING *
      `;
      const r = inserted[0];
      return {
        id: String(r.id),
        business_name: r.business_name ? String(r.business_name) : null,
        owner_email: r.owner_email ? String(r.owner_email) : null,
        owner_phone: r.owner_phone ? String(r.owner_phone) : null,
        backup_auto_deploy: Boolean(r.backup_auto_deploy),
        points_per_on_time: Number(r.points_per_on_time),
        points_per_backup: Number(r.points_per_backup),
        penalty_for_no_show: Number(r.penalty_for_no_show),
        created_at: String(r.created_at),
        updated_at: String(r.updated_at),
      };
    }
    const r = rows[0];
    return {
      id: String(r.id),
      business_name: r.business_name ? String(r.business_name) : null,
      owner_email: r.owner_email ? String(r.owner_email) : null,
      owner_phone: r.owner_phone ? String(r.owner_phone) : null,
      backup_auto_deploy: Boolean(r.backup_auto_deploy),
      points_per_on_time: Number(r.points_per_on_time),
      points_per_backup: Number(r.points_per_backup),
      penalty_for_no_show: Number(r.penalty_for_no_show),
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    };
  }
);

// ── Update settings ──────────────────────────────────────────────

export const updateSettings = createServerFn({ method: "POST" })
  .validator(
    (input: {
      business_name?: string;
      owner_email?: string;
      owner_phone?: string;
      backup_auto_deploy?: boolean;
      points_per_on_time?: number;
      points_per_backup?: number;
      penalty_for_no_show?: number;
    }) => input
  )
  .handler(async ({ data }) => {
    const current = await sql()`SELECT * FROM owner_settings LIMIT 1`;

    const businessName = data.business_name ?? current[0]?.business_name;
    const ownerEmail = data.owner_email ?? current[0]?.owner_email;
    const ownerPhone = data.owner_phone ?? current[0]?.owner_phone;
    const backupAuto = data.backup_auto_deploy ?? current[0]?.backup_auto_deploy;
    const ptsOnTime = data.points_per_on_time ?? current[0]?.points_per_on_time;
    const ptsBackup = data.points_per_backup ?? current[0]?.points_per_backup;
    const penalty = data.penalty_for_no_show ?? current[0]?.penalty_for_no_show;

    const rows = await sql()`
      UPDATE owner_settings
      SET business_name = ${businessName},
          owner_email = ${ownerEmail},
          owner_phone = ${ownerPhone},
          backup_auto_deploy = ${backupAuto},
          points_per_on_time = ${ptsOnTime},
          points_per_backup = ${ptsBackup},
          penalty_for_no_show = ${penalty},
          updated_at = now()
      WHERE id = ${current[0].id}
      RETURNING *
    `;

    const r = rows[0];
    return {
      id: String(r.id),
      business_name: r.business_name ? String(r.business_name) : null,
      owner_email: r.owner_email ? String(r.owner_email) : null,
      owner_phone: r.owner_phone ? String(r.owner_phone) : null,
      backup_auto_deploy: Boolean(r.backup_auto_deploy),
      points_per_on_time: Number(r.points_per_on_time),
      points_per_backup: Number(r.points_per_backup),
      penalty_for_no_show: Number(r.penalty_for_no_show),
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    } as OwnerSettings;
  });
