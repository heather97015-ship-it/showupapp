import { createFileRoute } from "@tanstack/react-router";
import { getJob, confirmAttendance, completeJob, runJobAutomations } from "~/lib/jobs";
import { useState } from "react";

export const Route = createFileRoute("/jobs/$jobId")({
  loader: async ({ params }) => {
    // Run automations: detect no-shows, deploy backups, send reminders
    const automations = await runJobAutomations({ data: { job_id: params.jobId } });
    // Reload the job to get the latest state
    const job = await getJob({ data: params.jobId });
    if (!job) throw new Error("Job not found");
    return { job, automations };
  },
  component: JobDetail,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  completed: "bg-gray-100 text-gray-700",
  no_show: "bg-red-100 text-red-700",
};

function JobDetail() {
  const { job, automations } = Route.useLoaderData();
  const { auto: autoResult, reminder: reminderResult } = automations;
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleConfirm() {
    setActionResult(null);
    setActionError(null);
    try {
      const result = await confirmAttendance({
        data: { job_id: job.id, cleaner_id: job.assigned_cleaner_id! },
      });
      if (result.success) {
        setActionResult("✓ Attendance confirmed!");
        setTimeout(() => window.location.reload(), 800);
      } else {
        setActionError(result.error ?? "Failed to confirm");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleComplete(wasOnTime: boolean) {
    setActionResult(null);
    setActionError(null);
    try {
      const cleanerId = job.backup_cleaner_id ?? job.assigned_cleaner_id;
      if (!cleanerId) {
        setActionError("No cleaner assigned");
        return;
      }
      await completeJob({ data: { job_id: job.id, cleaner_id: cleanerId, was_on_time: wasOnTime } });
      setActionResult("✓ Job completed!");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Status banner */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{job.title}</h1>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_COLORS[job.status] ?? "bg-gray-100"}`}
        >
          {job.status.replace("_", " ")}
        </span>
      </div>

      {/* Auto-process notification */}
      {autoResult.action !== "none" && (
        <div
          className={`rounded-lg p-3 text-sm ${
            autoResult.action === "backup_deployed"
              ? "bg-orange-50 text-orange-700 border border-orange-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <span className="font-medium">⚡ Automatic: </span>
          {autoResult.reason}
        </div>
      )}

      {/* SMS reminder status */}
      {reminderResult?.sent && (
        <div className="bg-blue-50 text-blue-700 rounded-lg p-3 text-sm border border-blue-200">
          📱 SMS reminder sent to {reminderResult.to}
        </div>
      )}

      {/* Job details card */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        {job.description && <p className="text-sm text-gray-600">{job.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-400">Date</span>
            <p className="font-medium">
              {new Date(job.scheduled_date + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Time</span>
            <p className="font-medium">{job.scheduled_time.slice(0, 5)}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">Location</span>
            <p className="font-medium">{job.location}</p>
          </div>
        </div>

        {/* Cleaner info */}
        <div className="border-t pt-3">
          <span className="text-gray-400 text-sm">Assigned Cleaner</span>
          <p className="font-medium">{job.cleaner_name ?? "Unassigned"}</p>
          {job.attendance_confirmed !== null && (
            <span
              className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                job.attendance_confirmed
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {job.attendance_confirmed ? "✓ Confirmed" : "✗ Not Confirmed"}
            </span>
          )}
        </div>

        {/* Backup info */}
        {job.backup_cleaner_name && (
          <div className="border-t pt-3">
            <span className="text-orange-500 text-sm font-medium">Backup Deployed</span>
            <p className="font-medium">{job.backup_cleaner_name}</p>
            {job.backup_deployed_at && (
              <p className="text-xs text-gray-400">
                Deployed {new Date(job.backup_deployed_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {job.notes && (
          <div className="border-t pt-3">
            <span className="text-gray-400 text-sm">Notes</span>
            <p className="text-sm">{job.notes}</p>
          </div>
        )}
      </div>

      {/* Action feedback */}
      {actionResult && (
        <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm">{actionResult}</div>
      )}
      {actionError && (
        <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{actionError}</div>
      )}

      {/* Action buttons */}
      {job.status !== "completed" && job.status !== "no_show" && (
        <div className="space-y-3">
          {/* Confirm attendance (for the assigned cleaner) */}
          {job.assigned_cleaner_id && !job.attendance_confirmed && job.status === "pending" && (
            <button
              onClick={handleConfirm}
              className="w-full bg-green-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-green-700"
            >
              ✓ Confirm Attendance
            </button>
          )}

          {/* Mark complete */}
          {(job.status === "confirmed" || job.status === "in_progress") && (
            <div className="flex gap-2">
              <button
                onClick={() => handleComplete(true)}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-indigo-700"
              >
                ✓ Complete (On Time)
              </button>
              <button
                onClick={() => handleComplete(false)}
                className="flex-1 bg-yellow-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-yellow-700"
              >
                ⚠ Complete (Late)
              </button>
            </div>
          )}

          {/* If pending and unassigned — hint */}
          {!job.assigned_cleaner_id && job.status === "pending" && (
            <p className="text-sm text-center text-gray-400">
              No cleaner assigned. The system will auto-detect this and mark it as no-show
              after the deadline.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
