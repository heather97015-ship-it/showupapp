import { createServerFn } from "@tanstack/react-start";

// ── Types ────────────────────────────────────────────────────────

interface SmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}

// ── Twilio client (lazy, graceful degradation) ────────────────────

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) return null;

  try {
    // Dynamic import to avoid build-time issues
    const { Twilio } = require("twilio") as typeof import("twilio");
    return new Twilio(accountSid, authToken);
  } catch {
    return null;
  }
}

function getFromNumber(): string | null {
  return process.env.TWILIO_PHONE_NUMBER ?? null;
}

// ── Core send function ────────────────────────────────────────────

async function sendSmsRaw(to: string, body: string): Promise<SmsResult> {
  const client = getTwilioClient();
  const from = getFromNumber();

  if (!client || !from) {
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const message = await client.messages.create({
      body,
      from,
      to,
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Twilio error";
    return { success: false, error: msg };
  }
}

// ── Server functions ──────────────────────────────────────────────

/**
 * Send a confirmation reminder to a cleaner 30 min before their job.
 * Called by the auto-scheduler.
 */
export const sendConfirmationReminder = createServerFn({ method: "POST" })
  .validator(
    (input: { cleaner_phone: string; job_title: string; job_time: string; location: string }) =>
      input
  )
  .handler(async ({ data }) => {
    const body = `ShowUp Reminder: You have a job "${data.job_title}" at ${data.job_time.slice(0, 5)} today at ${data.location}. Reply YES to confirm or NO if you can't make it.`;
    return sendSmsRaw(data.cleaner_phone, body);
  });

/**
 * Notify a backup cleaner that they've been assigned to a job.
 */
export const sendBackupNotification = createServerFn({ method: "POST" })
  .validator(
    (input: {
      backup_phone: string;
      job_title: string;
      job_time: string;
      location: string;
      original_cleaner: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const body = `ShowUp Backup: ${data.original_cleaner} can't make it. You're assigned to "${data.job_title}" at ${data.job_time.slice(0, 5)} at ${data.location}. Reply YES to confirm.`;
    return sendSmsRaw(data.backup_phone, body);
  });

/**
 * Alert the owner of a no-show or backup deployment.
 */
export const sendOwnerAlert = createServerFn({ method: "POST" })
  .validator(
    (input: { owner_phone: string; job_title: string; status: string; details?: string }) => input
  )
  .handler(async ({ data }) => {
    let body: string;
    if (data.status === "no_show") {
      body = `ShowUp Alert: NO-SHOW for "${data.job_title}".${data.details ? ` ${data.details}` : ""}`;
    } else if (data.status === "backup_deployed") {
      body = `ShowUp Alert: Backup deployed for "${data.job_title}".${data.details ? ` ${data.details}` : ""}`;
    } else {
      body = `ShowUp Update: "${data.job_title}" is now ${data.status}.${data.details ? ` ${data.details}` : ""}`;
    }
    return sendSmsRaw(data.owner_phone, body);
  });

/**
 * Send a custom SMS to any phone number (used for testing).
 */
export const sendSMS = createServerFn({ method: "POST" })
  .validator((input: { to: string; body: string }) => input)
  .handler(async ({ data }) => {
    return sendSmsRaw(data.to, data.body);
  });
