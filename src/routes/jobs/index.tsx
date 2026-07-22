import { createFileRoute, Link } from "@tanstack/react-router";
import { listJobs } from "~/lib/jobs";
import { useState } from "react";

export const Route = createFileRoute("/jobs/")({
  loader: () => listJobs(),
  component: JobsList,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500 text-white",
  confirmed: "bg-green-600 text-white",
  in_progress: "bg-indigo-600 text-white",
  completed: "bg-slate-600 text-white",
  no_show: "bg-red-600 text-white",
  high_risk: "bg-orange-600 text-white",
};

function JobsList() {
  const jobs = Route.useLoaderData();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);
  const today = new Date().toISOString().slice(0, 10);
  const todaysJobs = filtered.filter((j) => j.scheduled_date === today);
  const upcomingJobs = filtered.filter((j) => j.scheduled_date > today);
  const pastJobs = filtered.filter((j) => j.scheduled_date < today);

  const statuses = ["all", "pending", "confirmed", "in_progress", "completed", "no_show", "high_risk"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Link
          to="/jobs/new"
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700"
        >
          + New Job
        </Link>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize ${
              filter === s
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Today's jobs */}
      {todaysJobs.length > 0 && (
        <JobSection title="Today" jobs={todaysJobs} />
      )}
      {/* Upcoming */}
      {upcomingJobs.length > 0 && (
        <JobSection title="Upcoming" jobs={upcomingJobs} />
      )}
      {/* Past */}
      {pastJobs.length > 0 && (
        <JobSection title="Past" jobs={pastJobs} />
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No jobs found</p>
        </div>
      )}
    </div>
  );
}

function JobSection({ title, jobs }: { title: string; jobs: Awaited<ReturnType<typeof listJobs>> }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h2>
      <div className="space-y-2">
        {jobs.map((job) => (
          <Link
            key={job.id}
            to="/jobs/$jobId"
            params={{ jobId: job.id }}
            className="block bg-white rounded-xl border p-4 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{job.title}</div>
                <div className="text-sm text-gray-500">
                  {new Date(job.scheduled_date + "T" + job.scheduled_time).toLocaleString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {" · "}
                  {job.location}
                </div>
                {job.cleaner_name && (
                  <div className="text-xs text-gray-400 mt-1">
                    👤 {job.cleaner_name}
                    {job.backup_cleaner_name && (
                      <span className="text-orange-500 ml-2">↳ Backup: {job.backup_cleaner_name}</span>
                    )}
                  </div>
                )}
                {job.attendance_confirmed && (
                  <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ✓ Confirmed
                  </span>
                )}
              </div>
              <span
                className={`ml-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                  STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {job.status.replace("_", " ")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
