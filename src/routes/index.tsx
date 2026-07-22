import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboardSnapshot, deployBackup, sendJobReminders } from "~/lib/jobs";
import { useState } from "react";

export const Route = createFileRoute("/")({
  loader: () => getDashboardSnapshot(),
  component: Dashboard,
});

function Dashboard() {
  const data = Route.useLoaderData();
  const { today, week, cleanerDistribution, attendanceRate, backupSuccessRate, alerts } = data;

  const highRiskAlerts = (alerts ?? []).filter((a: any) => a.status === "high_risk");
  const pendingAlerts = (alerts ?? []).filter((a: any) => a.status !== "high_risk");
  const unconfirmed = (today?.pending ?? 0) + (today?.high_risk ?? 0);
  const hasHighRisk = (today?.high_risk ?? 0) > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Traffic-Light Banner */}
      {hasHighRisk ? (
        <div className="bg-orange-600 text-white rounded-xl px-5 py-3 text-center text-lg font-bold">
          {"⚠️ "}{today?.high_risk ?? 0}{" Job"}{(today?.high_risk ?? 0) !== 1 ? "s" : ""}{" High Risk — Pre-Flight Not Confirmed"}
        </div>
      ) : unconfirmed > 0 ? (
        <div className="bg-red-600 text-white rounded-xl px-5 py-3 text-center text-lg font-bold">
          {"⚠️ "}{unconfirmed}{" Cleaner"}{unconfirmed !== 1 ? "s" : ""}{" Unconfirmed — Action Needed"}
        </div>
      ) : (today?.confirmed ?? 0) > 0 ? (
        <div className="bg-green-600 text-white rounded-xl px-5 py-3 text-center text-lg font-bold">
          {"✅ All "}{today?.confirmed}{" Job"}{(today?.confirmed ?? 0) !== 1 ? "s" : ""}{" On Track"}
        </div>
      ) : null}

      {/* High Risk Alerts */}
      {highRiskAlerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">
            {"🚨 High Risk No-Show"}
          </h2>
          <div className="space-y-2">
            {highRiskAlerts.map((alert: any) => (
              <AlertCard key={alert.id} alert={alert} variant="high_risk" />
            ))}
          </div>
        </section>
      )}

      {/* Today's Snapshot */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Today's Snapshot
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <StatCard label="Scheduled" value={today?.total ?? 0} color="blue" />
          <StatCard label="Confirmed" value={today?.confirmed ?? 0} color="green" />
          <StatCard label="Pending" value={today?.pending ?? 0} color="yellow" />
          <StatCard label="In Progress" value={today?.in_progress ?? 0} color="indigo" />
          <StatCard label="No-Shows" value={today?.no_show ?? 0} color="red" />
          <StatCard label="High Risk" value={today?.high_risk ?? 0} color="orange" />
        </div>
      </section>

      {/* KPIs */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">KPIs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Weekly Attendance Rate"
            value={`${attendanceRate}%`}
            trend={attendanceRate >= 90 ? "up" : attendanceRate >= 75 ? "neutral" : "down"}
          />
          <KpiCard
            label="Backup Success Rate"
            value={`${backupSuccessRate}%`}
            trend={backupSuccessRate >= 80 ? "up" : backupSuccessRate >= 50 ? "neutral" : "down"}
          />
          <KpiCard
            label="Total Jobs This Week"
            value={`${week?.total ?? 0}`}
            trend="neutral"
          />
        </div>
      </section>

      {/* Pending / Past-Deadline Alerts */}
      {pendingAlerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {"⚠ Needs Attention"}
          </h2>
          <div className="space-y-2">
            {pendingAlerts.map((alert: any) => (
              <AlertCard key={alert.id} alert={alert} variant={alert.backup_name ? "backup" : "pending"} />
            ))}
          </div>
        </section>
      )}

      {/* Cleaner Reliability Distribution */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Cleaner Reliability
        </h2>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
            {(cleanerDistribution ?? []).map((tier: any) => {
              const total = (cleanerDistribution ?? []).reduce(
                (sum: number, t: any) => sum + t.count,
                0
              );
              const pct = total > 0 ? (tier.count / total) * 100 : 0;
              const colors: Record<string, string> = {
                excellent: "bg-green-500",
                good: "bg-blue-500",
                fair: "bg-yellow-500",
                poor: "bg-red-500",
              };
              return (
                <div
                  key={tier.tier}
                  className={`${colors[tier.tier] ?? "bg-gray-400"} flex items-center justify-center text-xs text-white font-medium`}
                  style={{ width: `${Math.max(pct, 8)}%` }}
                  title={`${tier.tier}: ${tier.count} cleaner${tier.count !== 1 ? "s" : ""}`}
                >
                  {tier.count}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{"⬤ Excellent (90+)"}</span>
            <span>{"⬤ Good (75-89)"}</span>
            <span>{"⬤ Fair (50-74)"}</span>
            <span>{"⬤ Poor (<50)"}</span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/jobs/new"
            className="bg-indigo-600 text-white text-center rounded-xl py-3 px-4 font-medium hover:bg-indigo-700 transition"
          >
            + New Job
          </Link>
          <Link
            to="/cleaners/new"
            className="bg-white text-indigo-600 border border-indigo-200 text-center rounded-xl py-3 px-4 font-medium hover:bg-indigo-50 transition"
          >
            + Add Cleaner
          </Link>
          <Link
            to="/jobs"
            className="bg-white text-gray-700 border text-center rounded-xl py-3 px-4 font-medium hover:bg-gray-50 transition"
          >
            View All Jobs
          </Link>
          <Link
            to="/points"
            className="bg-white text-gray-700 border text-center rounded-xl py-3 px-4 font-medium hover:bg-gray-50 transition"
          >
            Leaderboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function AlertCard({ alert, variant }: { alert: any; variant: "high_risk" | "pending" | "backup" }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function triggerBackup() {
    setBusy("backup"); setMsg(null);
    try {
      const r = await deployBackup({ data: { job_id: alert.id } });
      setMsg(r.success ? "✓ Backup deployed!" : r.error ?? "Failed");
    } catch { setMsg("Error deploying backup"); }
    setBusy(null);
  }

  async function sendReminder() {
    setBusy("reminder"); setMsg(null);
    try {
      const r = await sendJobReminders({ data: { job_id: alert.id } });
      setMsg(r.sent ? "✓ Reminder sent!" : "No phone on file");
    } catch { setMsg("Error sending reminder"); }
    setBusy(null);
  }

  const bg = variant === "high_risk" ? "bg-orange-50 border-orange-300"
    : variant === "backup" ? "bg-orange-50 border-orange-200"
    : "bg-red-50 border-red-200";

  const textColor = variant === "high_risk" ? "text-orange-700"
    : variant === "backup" ? "text-orange-700"
    : "text-red-700";

  return (
    <div className={`rounded-xl border p-3 ${bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium capitalize">{alert.title}</div>
          <div className={`text-xs mt-0.5 ${textColor}`}>
            {variant === "high_risk" && (
              <span>{"🟠 Pre-flight not confirmed — "}{alert.cleaner_name || "Unassigned"}</span>
            )}
            {variant === "backup" && (
              <span>{"🔄 Backup deployed: "}{alert.backup_name}</span>
            )}
            {variant === "pending" && (
              <span>{"⏰ Past deadline — "}{alert.cleaner_name || "Unassigned"}{" hasn't confirmed"}</span>
            )}
          </div>
          {msg && <div className="text-xs mt-1 font-medium text-green-700">{msg}</div>}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {alert.cleaner_phone && (
            <a
              href={`tel:${alert.cleaner_phone}`}
              className="px-2.5 py-1.5 text-xs font-medium bg-white border rounded-lg hover:bg-gray-50 whitespace-nowrap"
            >
              {"📞 Call"}
            </a>
          )}
          <button
            onClick={triggerBackup}
            disabled={busy === "backup"}
            className="px-2.5 py-1.5 text-xs font-medium bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
          >
            {busy === "backup" ? "..." : "⚡ Backup"}
          </button>
          <button
            onClick={sendReminder}
            disabled={busy === "reminder"}
            className="px-2.5 py-1.5 text-xs font-medium bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
          >
            {busy === "reminder" ? "..." : "💬 SMS"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "indigo" | "red" | "orange";
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    green: "bg-green-100 text-green-800 border-green-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
    red: "bg-red-100 text-red-800 border-red-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
  };
  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${colorMap[color]}`}>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
}) {
  const trendIcon = { up: "↑", down: "↓", neutral: "→" };
  const trendColor = { up: "text-green-500", down: "text-red-500", neutral: "text-gray-400" };
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-3xl font-bold">{value}</span>
        <span className={`text-lg ${trendColor[trend]}`}>{trendIcon[trend]}</span>
      </div>
    </div>
  );
}
