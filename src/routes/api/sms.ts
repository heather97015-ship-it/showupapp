import { createAPIFileRoute } from "@tanstack/react-start/api";
import { neon } from "@neondatabase/serverless";

/**
 * Twilio SMS webhook handler.
 * Receives POST from Twilio when a cleaner replies to a confirmation SMS.
 * Parses YES/NO and updates attendance accordingly.
 * Returns TwiML response.
 */
export const APIRoute = createAPIFileRoute("/api/sms")({
  POST: async ({ request }) => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>System unavailable</Message></Response>',
        { status: 500, headers: { "Content-Type": "text/xml" } }
      );
    }

    const db = neon(url);

    try {
      // Twilio sends form-encoded body
      const formData = await request.formData();
      const body = (formData.get("Body") as string) ?? "";
      const from = (formData.get("From") as string) ?? "";

      const reply = body.trim().toUpperCase();

      // Find the cleaner by phone number
      const cleaners = await db`SELECT id, name FROM cleaners WHERE phone = ${from} LIMIT 1`;

      if (cleaners.length === 0) {
        return twiml(`Sorry, we couldn't find a cleaner with phone ${from}.`);
      }

      const cleaner = cleaners[0];

      if (reply === "YES" || reply === "Y") {
        // Find the most recent pending job for this cleaner
        const jobs = await db`
          SELECT j.id, j.title FROM jobs j
          WHERE j.assigned_cleaner_id = ${cleaner.id}
            AND j.status = 'pending'
          ORDER BY j.scheduled_date DESC, j.scheduled_time DESC
          LIMIT 1
        `;

        if (jobs.length === 0) {
          // Check if assigned as backup
          const backupJobs = await db`
            SELECT j.id, j.title FROM jobs j
            WHERE j.backup_cleaner_id = ${cleaner.id}
              AND j.status = 'confirmed'
            ORDER BY j.scheduled_date DESC
            LIMIT 1
          `;

          if (backupJobs.length > 0) {
            const job = backupJobs[0];
            await db`
              UPDATE attendance_logs
              SET confirmed = true, confirmed_at = now()
              WHERE job_id = ${job.id} AND cleaner_id = ${cleaner.id}
            `;
            return twiml(`Thanks ${cleaner.name}! You're confirmed for the backup shift: "${job.title}".`);
          }

          return twiml(`Hi ${cleaner.name}, we couldn't find any pending jobs for you right now.`);
        }

        const job = jobs[0];

        // Confirm attendance
        await db`
          UPDATE attendance_logs
          SET confirmed = true, confirmed_at = now()
          WHERE job_id = ${job.id} AND cleaner_id = ${cleaner.id}
        `;

        await db`
          UPDATE jobs SET status = 'confirmed' WHERE id = ${job.id}
        `;

        return twiml(`Thanks ${cleaner.name}! You're confirmed for "${job.title}". See you there!`);
      }

      if (reply === "NO" || reply === "N") {
        // Find the most recent pending job for this cleaner
        const jobs = await db`
          SELECT j.id, j.title FROM jobs j
          WHERE j.assigned_cleaner_id = ${cleaner.id}
            AND j.status = 'pending'
          ORDER BY j.scheduled_date DESC, j.scheduled_time DESC
          LIMIT 1
        `;

        if (jobs.length === 0) {
          return twiml(`Hi ${cleaner.name}, we couldn't find any pending jobs to cancel.`);
        }

        const job = jobs[0];

        // Mark as no-show and apply penalty
        await db`
          UPDATE attendance_logs
          SET confirmed = false, status = 'no_show'
          WHERE job_id = ${job.id} AND cleaner_id = ${cleaner.id}
        `;

        const settings = await db`SELECT penalty_for_no_show FROM owner_settings LIMIT 1`;
        const penalty = settings.length > 0 ? settings[0].penalty_for_no_show : -50;

        await db`
          INSERT INTO points_transactions (cleaner_id, points, reason, reference_job_id)
          VALUES (${cleaner.id}, ${penalty}, 'no_show', ${job.id})
        `;

        await db`
          UPDATE cleaners
          SET points_balance = GREATEST(0, points_balance + ${penalty}),
              reliability_score = GREATEST(0, reliability_score - 10)
          WHERE id = ${cleaner.id}
        `;

        // Try to deploy backup
        const backups = await db`
          SELECT id, name FROM cleaners
          WHERE is_active = true
            AND id != ${cleaner.id}
            AND id NOT IN (
              SELECT assigned_cleaner_id FROM jobs
              WHERE scheduled_date = (SELECT scheduled_date FROM jobs WHERE id = ${job.id})
                AND assigned_cleaner_id IS NOT NULL
                AND status NOT IN ('completed', 'no_show')
            )
          ORDER BY reliability_score DESC, points_balance DESC
          LIMIT 1
        `;

        if (backups.length > 0) {
          const backup = backups[0];
          const backupPts = settings.length > 0 ? settings[0].points_per_backup ?? 25 : 25;

          await db`
            UPDATE jobs
            SET backup_cleaner_id = ${backup.id}, backup_deployed_at = now(), status = 'confirmed'
            WHERE id = ${job.id}
          `;

          await db`
            INSERT INTO attendance_logs (job_id, cleaner_id) VALUES (${job.id}, ${backup.id})
          `;

          await db`
            INSERT INTO points_transactions (cleaner_id, points, reason, reference_job_id)
            VALUES (${backup.id}, ${backupPts}, 'backup_shift', ${job.id})
          `;

          await db`
            UPDATE cleaners SET points_balance = points_balance + ${backupPts} WHERE id = ${backup.id}
          `;

          return twiml(
            `Got it ${cleaner.name}. You've been marked unavailable. Backup ${backup.name} has been assigned.`
          );
        }

        await db`UPDATE jobs SET status = 'no_show' WHERE id = ${job.id}`;

        return twiml(
          `Got it ${cleaner.name}. We've noted you can't make "${job.title}". No backup was available.`
        );
      }

      // Unrecognized reply
      return twiml(
        `Hi ${cleaner.name}, reply YES to confirm or NO to cancel. For help, contact your manager.`
      );
    } catch (err) {
      console.error("SMS webhook error:", err);
      return twiml("Sorry, something went wrong. Please try again or contact your manager.");
    }
  },
});

function twiml(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
