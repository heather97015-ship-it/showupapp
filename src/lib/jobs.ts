import { createServerFn } from "@tanstack/react-start";
import { sql, query } from "~/db";

// ── Types ────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  assigned_cleaner_id: string | null;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "no_show" | "high_risk";
  backup_cleaner_id: string | null;
  backup_deployed_at: string | null;
  notes: string | null;
  client_name: string | null;
  client_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_radius: number | null;
  created_at: string;
  // Joined fields
  cleaner_name?: string | null;
  backup_cleaner_name?: string | null;
  attendance_status?: string | null;
  attendance_confirmed?: boolean | null;
}

export interface JobInput {
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  assigned_cleaner_id?: string;
  notes?: string;
  client_name?: string;
  client_phone?: string;
  latitude?: number;
  longitude?: number;
  geofence_radius?: number;
}

// Base query fragment used as raw SQL string for composition
const JOB_SELECT_SQL = `
  SELECT j.*,
    c.name AS cleaner_name,
    bc.name AS backup_cleaner_name,
    al.status AS attendance_status,
    al.confirmed AS attendance_confirmed
  FROM jobs j
  LEFT JOIN cleaners c ON j.assigned_cleaner_id = c.id
  LEFT JOIN cleaners bc ON j.backup_cleaner_id = bc.id
  LEFT JOIN attendance_logs al ON al.job_id = j.id AND al.cleaner_id = j.assigned_cleaner_id
`;

function mapJob(row: Record<string, unknown>): Job {
  return {
    id: String(row.id),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    scheduled_date: String(row.scheduled_date),
    scheduled_time: String(row.scheduled_time),
    location: String(row.location),
    assigned_cleaner_id: row.assigned_cleaner_id ? String(row.assigned_cleaner_id) : null,
    status: String(row.status) as Job["status"],
    backup_cleaner_id: row.backup_cleaner_id ? String(row.backup_cleaner_id) : null,
    backup_deployed_at: row.backup_deployed_at ? String(row.backup_deployed_at) : null,
    notes: row.notes ? String(row.notes) : null,
    client_name: row.client_name ? String(row.client_name) : null,
    client_phone: row.client_phone ? String(row.client_phone) : null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    geofence_radius: row.geofence_radius != null ? Number(row.geofence_radius) : null,
    created_at: String(row.created_at),
    cleaner_name: row.cleaner_name ? String(row.cleaner_name) : null,
    backup_cleaner_name: row.backup_cleaner_name ? String(row.backup_cleaner_name) : null,
    attendance_status: row.attendance_status ? String(row.attendance_status) : null,
    attendance_confirmed: row.attendance_confirmed != null ? Boolean(row.attendance_confirmed) : null,
  };
}

// ── List jobs ────────────────────────────────────────────────────

export const listJobs = createServerFn({ method: "GET" })
  .validator((filter?: { status?: string; date?: string }) => filter ?? {})
  .handler(async ({ data: filter }) => {
    let sqlStr = `${JOB_SELECT_SQL}`;
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (filter.status && filter.status !== "all") {
      sqlStr += ` WHERE j.status = ${paramIdx++}`;
      params.push(filter.status);
      if (filter.date) {
        sqlStr += ` AND j.scheduled_date = ${paramIdx++}`;
        params.push(filter.date);
      }
    } else if (filter.date) {
      sqlStr += ` WHERE j.scheduled_date = ${paramIdx++}`;
      params.push(filter.date);
    }

    sqlStr += " ORDER BY j.scheduled_date DESC, j.scheduled_time ASC";
    const rows = await query(sqlStr, params);
    return rows.map(mapJob);
  });

// ── Get today's jobs ─────────────────────────────────────────────

export const getTodaysJobs = createServerFn({ method: "GET" }).handler(async (): Promise<Job[]> => {
  const rows = await query(
    `${JOB_SELECT_SQL} WHERE j.scheduled_date = CURRENT_DATE ORDER BY j.scheduled_time ASC`
  );
  return rows.map(mapJob);
});

// ── Get single job ───────────────────────────────────────────────

export const getJob = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<Job | null> => {
    const rows = await query(`${JOB_SELECT_SQL} WHERE j.id = $1`, [id]);
    if (rows.length === 0) return null;
    return mapJob(rows[0]);
  });

// ── Create job ───────────────────────────────────────────────────

export const createJob = createServerFn({ method: "POST" })
  .validator((input: JobInput) => input)
  .handler(async ({ data }) => {
    const rows = await sql()`
      INSERT INTO jobs (title, description, scheduled_date, scheduled_time, location, assigned_cleaner_id, notes,
        client_name, client_phone, latitude, longitude, geofence_radius)
      VALUES (${data.title}, ${data.description ?? null}, ${data.scheduled_date},
              ${data.scheduled_time}, ${data.location}, ${data.assigned_cleaner_id ?? null}, ${data.notes ?? null},
              ${data.client_name ?? null}, ${data.client_phone ?? null}, ${data.latitude ?? null},
              ${data.longitude ?? null}, ${data.geofence_radius ?? null})
      RETURNING *
    `;

    // Create attendance record if cleaner is assigned
    if (data.assigned_cleaner_id) {
      const jobId = rows[0].id;
      await sql()`
        INSERT INTO attendance_logs (job_id, cleaner_id)
        VALUES (${jobId}, ${data.assigned_cleaner_id})
      `;
    }

    return mapJob(rows[0]);
  });

// ── Update job ───────────────────────────────────────────────────

export const updateJob = createServerFn({ method: "POST" })
  .validator(
    (input: {
      id: string;
      title: string;
      description?: string;
      scheduled_date: string;
      scheduled_time: string;
      location: string;
      assigned_cleaner_id?: string;
      notes?: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const rows = await sql()`
      UPDATE jobs
      SET title = ${data.title},
          description = ${data.description ?? null},
          scheduled_date = ${data.scheduled_date},
          scheduled_time = ${data.scheduled_time},
          location = ${data.location},
          assigned_cleaner_id = ${data.assigned_cleaner_id ?? null},
          notes = ${data.notes ?? null}
      WHERE id = ${data.id}
      RETURNING *
    `;
    if (rows.length === 0) throw new Error("Job not found");
    return mapJob(rows[0]);
  });

// ── Confirm attendance (cleaner confirms they'll show up) ────────

export const confirmAttendance = createServerFn({ method: "POST" })
  .validator((input: { job_id: string; cleaner_id: string }) => input)
  .handler(async ({ data }) => {
    const rows = await sql()`
      UPDATE attendance_logs
      SET confirmed = true, confirmed_at = now()
      WHERE job_id = ${data.job_id} AND cleaner_id = ${data.cleaner_id}
      RETURNING *
    `;

    // Update job status to confirmed
    await sql()`
      UPDATE jobs SET status = 'confirmed' WHERE id = ${data.job_id}
    `;

    return rows.length > 0 ? { success: true } : { success: false, error: "Attendance record not found" };
  });

// ── Mark no-show ─────────────────────────────────────────────────

export const markNoShow = createServerFn({ method: "POST" })
  .validator((input: { job_id: string; cleaner_id: string }) => input)
  .handler(async ({ data }) => {
    await sql()`
      UPDATE attendance_logs
      SET confirmed = false, status = 'no_show'
      WHERE job_id = ${data.job_id} AND cleaner_id = ${data.cleaner_id}
    `;

    await sql()`
      UPDATE jobs SET status = 'no_show' WHERE id = ${data.job_id}
    `;

    // Apply no-show penalty
    const settings = await sql()`SELECT penalty_for_no_show FROM owner_settings LIMIT 1`;
    const penalty = settings.length > 0 ? settings[0].penalty_for_no_show : -50;

    await sql()`
      INSERT INTO points_transactions (cleaner_id, points, reason, reference_job_id)
      VALUES (${data.cleaner_id}, ${penalty}, 'no_show', ${data.job_id})
    `;

    await sql()`
      UPDATE cleaners
      SET points_balance = GREATEST(0, points_balance + ${penalty}),
          reliability_score = GREATEST(0, reliability_score - 10)
      WHERE id = ${data.cleaner_id}
    `;

    return { success: true };
  });

// ── Deploy backup ────────────────────────────────────────────────

export const deployBackup = createServerFn({ method: "POST" })
  .validator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    // Get the job
    const jobRows = await sql()`SELECT * FROM jobs WHERE id = ${data.job_id}`;
    if (jobRows.length === 0) throw new Error("Job not found");
    const job = jobRows[0];

    // Find the best available backup: active, not the original cleaner, not already assigned today,
    // ordered by reliability_score desc (then points_balance desc)
    const backups = await sql()`
      SELECT * FROM cleaners
      WHERE is_active = true
        AND id != ${job.assigned_cleaner_id}
        AND id NOT IN (
          SELECT assigned_cleaner_id FROM jobs
          WHERE scheduled_date = ${job.scheduled_date}
            AND assigned_cleaner_id IS NOT NULL
            AND status NOT IN ('completed', 'no_show')
        )
      ORDER BY reliability_score DESC, points_balance DESC
      LIMIT 1
    `;

    if (backups.length === 0) {
      return { success: false, error: "No available backup cleaners" };
    }

    const backup = backups[0];

    // Assign backup
    await sql()`
      UPDATE jobs
      SET backup_cleaner_id = ${backup.id}, backup_deployed_at = now(), status = 'confirmed'
      WHERE id = ${data.job_id}
    `;

    // Create attendance record for backup
    await sql()`
      INSERT INTO attendance_logs (job_id, cleaner_id)
      VALUES (${data.job_id}, ${backup.id})
    `;

    // Award backup points
    const settings = await sql()`SELECT points_per_backup FROM owner_settings LIMIT 1`;
    const pts = settings.length > 0 ? settings[0].points_per_backup : 25;

    await sql()`
      INSERT INTO points_transactions (cleaner_id, points, reason, reference_job_id)
      VALUES (${backup.id}, ${pts}, 'backup_shift', ${data.job_id})
    `;

    await sql()`
      UPDATE cleaners
      SET points_balance = points_balance + ${pts}
      WHERE id = ${backup.id}
    `;

    return { success: true, backup_cleaner_id: backup.id, backup_cleaner_name: backup.name };
  });

// ── Mark job complete ────────────────────────────────────────────

export const completeJob = createServerFn({ method: "POST" })
  .validator((input: { job_id: string; cleaner_id: string; was_on_time: boolean }) => input)
  .handler(async ({ data }) => {
    await sql()`
      UPDATE jobs SET status = 'completed' WHERE id = ${data.job_id}
    `;

    await sql()`
      UPDATE attendance_logs
      SET status = ${data.was_on_time ? "ontime" : "late"}, actual_arrival_time = now()
      WHERE job_id = ${data.job_id} AND cleaner_id = ${data.cleaner_id}
    `;

    // Award points
    const settings = await sql()`SELECT points_per_on_time, points_per_backup FROM owner_settings LIMIT 1`;
    const onTimePts = settings.length > 0 ? settings[0].points_per_on_time : 10;

    const reason = data.was_on_time ? "on_time" : "late";
    const points = data.was_on_time ? onTimePts : -10;

    const cleanerId = data.cleaner_id;
    await sql()`
      INSERT INTO points_transactions (cleaner_id, points, reason, reference_job_id)
      VALUES (${cleanerId}, ${points}, ${reason}, ${data.job_id})
    `;

    await sql()`
      UPDATE cleaners
      SET points_balance = GREATEST(0, points_balance + ${points}),
          reliability_score = LEAST(100, reliability_score + ${data.was_on_time ? 2 : -5})
      WHERE id = ${cleanerId}
    `;

    return { success: true };
  });

// ── Pre-flight reminder (2 hours before job) ────────────────────

export const sendPreFlightReminder = createServerFn({ method: "POST" })
  .validator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    const db = sql();
    const jobRows = await query(`${JOB_SELECT_SQL} WHERE j.id = $1`, [data.job_id]);
    if (jobRows.length === 0) return { sent: false, reason: "Job not found" };
    const job = mapJob(jobRows[0]);
    if (job.status !== "pending" || !job.assigned_cleaner_id) return { sent: false, reason: "Not pending" };

    const now = new Date();
    const sched = new Date(`${job.scheduled_date}T${job.scheduled_time}`);
    const preWindow = new Date(sched.getTime() - 2 * 60 * 60 * 1000);
    if (now < preWindow || now > sched) return { sent: false, reason: "Not in pre-flight window" };

    const cleaners = await db`SELECT phone FROM cleaners WHERE id = ${job.assigned_cleaner_id}`;
    if (!cleaners[0]?.phone) return { sent: false, reason: "No phone" };

    await db`UPDATE attendance_logs SET pre_flight_sent_at = now() WHERE job_id = ${data.job_id} AND cleaner_id = ${job.assigned_cleaner_id}`;

    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;
      if (!sid || !token || !from) return { sent: false, reason: "Twilio not configured" };
      const { Twilio } = require("twilio") as typeof import("twilio");
      const client = new Twilio(sid, token);
      await client.messages.create({
        body: `ShowUp Pre-Flight: "${job.title}" at ${job.scheduled_time.slice(0,5)} today, ${job.location}. Reply YES to confirm you are on track, or NO if you cannot make it.`,
        from, to: String(cleaners[0].phone),
      });
      return { sent: true };
    } catch (e) {
      return { sent: false, reason: String(e) };
    }
  });

// ── Confirm pre-flight ───────────────────────────────────────────

export const confirmPreFlight = createServerFn({ method: "POST" })
  .validator((input: { job_id: string; cleaner_id: string }) => input)
  .handler(async ({ data }) => {
    await sql()`UPDATE attendance_logs SET pre_flight_confirmed = true WHERE job_id = ${data.job_id} AND cleaner_id = ${data.cleaner_id}`;
    return { success: true };
  });

// ── Broadcast backup to multiple cleaners ────────────────────────

export const broadcastBackup = createServerFn({ method: "POST" })
  .validator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    const db = sql();
    const jobRows = await db`SELECT * FROM jobs WHERE id = ${data.job_id}`;
    if (jobRows.length === 0) throw new Error("Job not found");
    const job = jobRows[0];
    const cleaners = await db`SELECT id, name, phone FROM cleaners WHERE is_active = true AND id != ${job.assigned_cleaner_id || ""} ORDER BY reliability_score DESC LIMIT 5`;
    const settings = await db`SELECT points_per_backup FROM owner_settings LIMIT 1`;
    const pts = settings[0]?.points_per_backup || 25;
    let notified = 0;
    for (const c of cleaners) {
      if (!c.phone) continue;
      try {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_PHONE_NUMBER;
        if (sid && token && from) {
          const { Twilio } = require("twilio") as typeof import("twilio");
          const client = new Twilio(sid, token);
          await client.messages.create({
            body: `ShowUp Open Shift: "${job.title}" at ${String(job.scheduled_time).slice(0,5)}, ${job.location}. +${pts} bonus points. Reply YES to take this shift.`,
            from, to: String(c.phone),
          });
          notified++;
        }
      } catch (_) {}
    }
    return { success: true, notified, total: cleaners.length };
  });

// ── Report access blocked ────────────────────────────────────────

export const reportAccessBlocked = createServerFn({ method: "POST" })
  .validator((input: { job_id: string; cleaner_id: string }) => input)
  .handler(async ({ data }) => {
    const db = sql();
    const jobRows = await db`SELECT j.title, j.location, c.name AS cleaner_name FROM jobs j JOIN cleaners c ON c.id = ${data.cleaner_id} WHERE j.id = ${data.job_id}`;
    if (jobRows.length === 0) return { success: false };
    const j = jobRows[0];
    try {
      const settings = await db`SELECT owner_phone FROM owner_settings LIMIT 1`;
      if (settings[0]?.owner_phone) {
        const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_PHONE_NUMBER;
        if (sid && token && from) {
          const { Twilio } = require("twilio") as typeof import("twilio");
          await new Twilio(sid, token).messages.create({
            body: `🚨 ACCESS BLOCKED: ${j.cleaner_name} at "${j.title}" cannot get into ${j.location}. Client code needed.`,
            from, to: String(settings[0].owner_phone),
          });
        }
      }
    } catch (_) {}
    return { success: true };
  });

// ── Client delay notification ────────────────────────────────────

export const sendClientDelayNotification = createServerFn({ method: "POST" })
  .validator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    const db = sql();
    const jobRows = await db`SELECT client_phone, client_name, title, scheduled_time FROM jobs WHERE id = ${data.job_id}`;
    if (jobRows.length === 0 || !jobRows[0].client_phone) return { sent: false };
    const j = jobRows[0];
    const now = new Date();
    const sched = new Date(`${(new Date()).toISOString().slice(0,10)}T${j.scheduled_time}`);
    if (now < new Date(sched.getTime() + 15 * 60 * 1000)) return { sent: false };
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_PHONE_NUMBER;
      if (sid && token && from) {
        const { Twilio } = require("twilio") as typeof import("twilio");
        await new Twilio(sid, token).messages.create({
          body: `ShowUp Update: Your cleaner for "${j.title}" is slightly delayed. They are en route and will arrive shortly. We will notify you when they are on-site.`,
          from, to: String(j.client_phone),
        });
        return { sent: true };
      }
    } catch (_) {}
    return { sent: false };
  });

// ── Auto-process job (no-show detection + backup deployment) ─────

export const autoProcessJob = createServerFn({ method: "POST" })
  .validator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    const db = sql();

    // Get the job with attendance info
    const jobRows = await query(`${JOB_SELECT_SQL} WHERE j.id = $1`, [data.job_id]);
    if (jobRows.length === 0) throw new Error("Job not found");
    const job = mapJob(jobRows[0]);

    // Only auto-process pending jobs
    if (job.status !== "pending") {
      return { action: "none", reason: "Job is not pending", job };
    }

    // Check if 30 minutes have passed since the scheduled time
    const now = new Date();
    const scheduledDateTime = new Date(`${job.scheduled_date}T${job.scheduled_time}`);
    const bufferMs = 30 * 60 * 1000; // 30 minutes
    const deadline = new Date(scheduledDateTime.getTime() + bufferMs);

    if (now < deadline) {
      return { action: "none", reason: "Still within confirmation window", job };
    }

    // Check if cleaner has confirmed
    if (job.attendance_confirmed) {
      return { action: "none", reason: "Cleaner already confirmed", job };
    }

    // No cleaner assigned — just mark as no-show
    if (!job.assigned_cleaner_id) {
      await db`UPDATE jobs SET status = 'no_show' WHERE id = ${data.job_id}`;
      return { action: "no_show", reason: "No cleaner assigned", job };
    }

    // Cleaner hasn't confirmed and deadline passed — mark no-show + apply penalty
    await db`
      UPDATE attendance_logs
      SET confirmed = false, status = 'no_show'
      WHERE job_id = ${data.job_id} AND cleaner_id = ${job.assigned_cleaner_id}
    `;

    // Apply no-show penalty
    const settings = await db`SELECT penalty_for_no_show, points_per_backup, backup_auto_deploy FROM owner_settings LIMIT 1`;
    const penalty = settings.length > 0 ? settings[0].penalty_for_no_show : -50;

    await db`
      INSERT INTO points_transactions (cleaner_id, points, reason, reference_job_id)
      VALUES (${job.assigned_cleaner_id}, ${penalty}, 'no_show', ${data.job_id})
    `;

    await db`
      UPDATE cleaners
      SET points_balance = GREATEST(0, points_balance + ${penalty}),
          reliability_score = GREATEST(0, reliability_score - 10)
      WHERE id = ${job.assigned_cleaner_id}
    `;

    // Try to deploy backup
    const backups = await db`
      SELECT * FROM cleaners
      WHERE is_active = true
        AND id != ${job.assigned_cleaner_id}
        AND id NOT IN (
          SELECT assigned_cleaner_id FROM jobs
          WHERE scheduled_date = ${job.scheduled_date}
            AND assigned_cleaner_id IS NOT NULL
            AND status NOT IN ('completed', 'no_show')
        )
      ORDER BY reliability_score DESC, points_balance DESC
      LIMIT 1
    `;

    if (backups.length > 0) {
      const backup = backups[0];
      const backupPts = settings.length > 0 ? settings[0].points_per_backup : 25;

      await db`
        UPDATE jobs
        SET backup_cleaner_id = ${backup.id},
            backup_deployed_at = now(),
            status = 'confirmed'
        WHERE id = ${data.job_id}
      `;

      await db`
        INSERT INTO attendance_logs (job_id, cleaner_id)
        VALUES (${data.job_id}, ${backup.id})
      `;

      await db`
        INSERT INTO points_transactions (cleaner_id, points, reason, reference_job_id)
        VALUES (${backup.id}, ${backupPts}, 'backup_shift', ${data.job_id})
      `;

      await db`
        UPDATE cleaners
        SET points_balance = points_balance + ${backupPts}
        WHERE id = ${backup.id}
      `;

      return {
        action: "backup_deployed",
        reason: `No-show by ${job.cleaner_name}, backup ${backup.name} deployed`,
        backup_cleaner_id: backup.id,
        backup_cleaner_name: backup.name,
        job,
      };
    }

    // No backup available — mark as no-show
    await db`UPDATE jobs SET status = 'no_show' WHERE id = ${data.job_id}`;

    return {
      action: "no_show",
      reason: `No-show by ${job.cleaner_name}, no backup available`,
      job,
    };
  });

// ── Send SMS reminders for upcoming jobs ──────────────────────────

export const sendJobReminders = createServerFn({ method: "POST" })
  .validator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    const db = sql();

    const jobRows = await query(`${JOB_SELECT_SQL} WHERE j.id = $1`, [data.job_id]);
    if (jobRows.length === 0) return { sent: false, reason: "Job not found" };
    const job = mapJob(jobRows[0]);

    if (job.status !== "pending" || !job.assigned_cleaner_id) {
      return { sent: false, reason: "Job not pending or no cleaner assigned" };
    }

    // Check if we're in the 30-min window before the job
    const now = new Date();
    const scheduledDateTime = new Date(`${job.scheduled_date}T${job.scheduled_time}`);
    const reminderWindowStart = new Date(scheduledDateTime.getTime() - 30 * 60 * 1000);

    if (now < reminderWindowStart || now > scheduledDateTime) {
      return { sent: false, reason: "Not in reminder window" };
    }

    // Get cleaner's phone
    const cleaners = await db`SELECT phone FROM cleaners WHERE id = ${job.assigned_cleaner_id}`;
    if (cleaners.length === 0 || !cleaners[0].phone) {
      return { sent: false, reason: "No phone number on file" };
    }

    const phone = String(cleaners[0].phone);

    // Try to send SMS via Twilio
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        return { sent: false, reason: "Twilio not configured" };
      }

      const { Twilio } = require("twilio") as typeof import("twilio");
      const client = new Twilio(accountSid, authToken);

      const body = `ShowUp Reminder: "${job.title}" at ${job.scheduled_time.slice(0, 5)} today, ${job.location}. Reply YES to confirm or NO to cancel.`;

      await client.messages.create({ body, from: fromNumber, to: phone });

      return { sent: true, to: phone };
    } catch (err) {
      return {
        sent: false,
        reason: err instanceof Error ? err.message : "SMS send failed",
      };
    }
  });

// ── Run all automations for a job (called from job detail loader) ─

export const runJobAutomations = createServerFn({ method: "POST" })
  .validator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    // Run both auto-process and SMS reminder in parallel
    const [autoResult, reminderResult, preFlightResult, clientDelayResult] = await Promise.all([
      autoProcessJob({ data: { job_id: data.job_id } }),
      sendJobReminders({ data: { job_id: data.job_id } }),
      sendPreFlightReminder({ data: { job_id: data.job_id } }),
      sendClientDelayNotification({ data: { job_id: data.job_id } }),
    ]);

    // After pre-flight window, if not confirmed, mark high_risk
    const db = sql();
    const alRows = await db`SELECT j.status, al.pre_flight_confirmed, al.pre_flight_sent_at FROM jobs j LEFT JOIN attendance_logs al ON al.job_id = j.id AND al.cleaner_id = j.assigned_cleaner_id WHERE j.id = ${data.job_id}`;
    if (alRows.length > 0 && alRows[0].status === "pending" && alRows[0].pre_flight_sent_at && !alRows[0].pre_flight_confirmed) {
      const schedRows = await db`SELECT scheduled_date, scheduled_time FROM jobs WHERE id = ${data.job_id}`;
      if (schedRows.length > 0) {
        const sched = new Date(`${schedRows[0].scheduled_date}T${schedRows[0].scheduled_time}`);
        if (new Date() > sched) {
          await db`UPDATE jobs SET status = 'high_risk' WHERE id = ${data.job_id}`;
        }
      }
    }

    return { auto: autoResult, reminder: reminderResult, preFlight: preFlightResult, clientDelay: clientDelayResult };
  });

// ── Dashboard snapshot ───────────────────────────────────────────

export const getDashboardSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const today = await sql()`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE status = 'no_show')::int AS no_show,
      COUNT(*) FILTER (WHERE status = 'high_risk')::int AS high_risk,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
    FROM jobs WHERE scheduled_date = CURRENT_DATE
  `;

  const weekStats = await sql()`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'no_show')::int AS no_shows,
      COUNT(*) FILTER (WHERE backup_cleaner_id IS NOT NULL)::int AS backups_deployed
    FROM jobs
    WHERE scheduled_date >= CURRENT_DATE - INTERVAL '7 days'
  `;

  // Backup success rate: backups that resulted in completed jobs
  const backupStats = await sql()`
    SELECT
      COUNT(*)::int AS total_backups,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS successful_backups
    FROM jobs
    WHERE backup_cleaner_id IS NOT NULL
      AND scheduled_date >= CURRENT_DATE - INTERVAL '7 days'
  `;

  // Cleaner distribution
  const cleanerDist = await sql()`
    SELECT tier, COUNT(*)::int AS count
    FROM (
      SELECT
        CASE
          WHEN reliability_score >= 90 THEN 'excellent'
          WHEN reliability_score >= 75 THEN 'good'
          WHEN reliability_score >= 50 THEN 'fair'
          ELSE 'poor'
        END AS tier
      FROM cleaners WHERE is_active = true
    ) sub
    GROUP BY tier
    ORDER BY
      CASE tier
        WHEN 'excellent' THEN 1
        WHEN 'good' THEN 2
        WHEN 'fair' THEN 3
        ELSE 4
      END
  `;

  // Jobs needing attention: pending past their scheduled time + 30 min, or recently got backups
  const alerts = await sql()`
    SELECT j.id, j.title, j.status, j.backup_deployed_at,
      c.name AS cleaner_name, c.phone AS cleaner_phone, bc.name AS backup_name,
      j.client_name, j.client_phone
    FROM jobs j
    LEFT JOIN cleaners c ON j.assigned_cleaner_id = c.id
    LEFT JOIN cleaners bc ON j.backup_cleaner_id = bc.id
    WHERE (
      -- Pending jobs past their window
      (j.status = 'pending'
       AND (j.scheduled_date < CURRENT_DATE
            OR (j.scheduled_date = CURRENT_DATE AND j.scheduled_time < (CURRENT_TIME - INTERVAL '30 minutes'))))
      OR
      -- High risk jobs (pre-flight not confirmed)
      j.status = 'high_risk'
      OR
      -- Jobs that recently got a backup deployed today
      (j.backup_deployed_at IS NOT NULL
       AND j.backup_deployed_at >= CURRENT_DATE
       AND j.status != 'completed')
    )
    ORDER BY
      CASE WHEN j.status = 'high_risk' THEN 0
           WHEN j.status = 'no_show' THEN 1
           ELSE 2 END,
      j.scheduled_date ASC, j.scheduled_time ASC
    LIMIT 10
  `;

  return {
    today: today[0],
    week: weekStats[0],
    backups: backupStats[0],
    cleanerDistribution: cleanerDist,
    alerts: alerts.map((a: any) => ({
      id: String(a.id),
      title: String(a.title),
      status: String(a.status),
      backup_deployed_at: a.backup_deployed_at ? String(a.backup_deployed_at) : null,
      cleaner_name: a.cleaner_name ? String(a.cleaner_name) : null,
      cleaner_phone: a.cleaner_phone ? String(a.cleaner_phone) : null,
      backup_name: a.backup_name ? String(a.backup_name) : null,
      client_name: a.client_name ? String(a.client_name) : null,
      client_phone: a.client_phone ? String(a.client_phone) : null,
    })),
    attendanceRate:
      weekStats[0].total > 0
        ? Math.round(((weekStats[0].total - weekStats[0].no_shows) / weekStats[0].total) * 100)
        : 100,
    backupSuccessRate:
      backupStats[0].total_backups > 0
        ? Math.round((backupStats[0].successful_backups / backupStats[0].total_backups) * 100)
        : 100,
  };
});
