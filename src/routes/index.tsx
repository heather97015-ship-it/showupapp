import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboardSnapshot } from "~/lib/jobs";
import { useState } from "react";

export const Route = createFileRoute("/")({
  loader: () => getDashboardSnapshot(),
  component: Dashboard,
});

function Dashboard() {
  const data = Route.useLoaderData();
  const { today, week, backups, cleanerDistribution, attendanceRate, backupSuccessRate, alerts } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Today's Snapshot */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Today's Snapshot
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Scheduled" value={today?.total ?? 0} color="blue" />
          <StatCard label="Confirmed" value={today?.confirmed ?? 0} color="green" />
          <StatCard label="Pending" value={today?.pending ?? 0} color="yellow" />
          <StatCard label="In Progress" value={today?.in_progress ?? 0} color="indigo" />
          <StatCard label="No-Shows" value={today?.no_show ?? 0} color="red" />
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

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            ⚠ Needs Attention
          </h2>
          <div className="space-y-2">
            {alerts.map((alert: any) => (
              <Link
                key={alert.id}
                to="/jobs/$jobId"
                params={{ jobId: alert.id }}
                className={`block rounded-xl border p-3 ${
                  alert.backup_name
                    ? "bg-orange-50 border-orange-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{alert.title}</div>
                    <div className="text-xs mt-0.5">
                      {alert.backup_name ? (
                        <span className="text-orange-700">
                          🔄 Backup deployed: {alert.backup_name}
                        </span>
                      ) : (
                        <span className="text-red-700">
                          ⏰ Past deadline — {alert.cleaner_name || "Unassigned"} hasn't confirmed
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">View →</span>
                </div>
              </Link>
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
            {(cleanerDistribution ?? []).map((tier: { tier: string; count: number }) => {
              const total = (cleanerDistribution ?? []).reduce(
                (sum: number, t: { count: number }) => sum + t.count,
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
            <span>⬤ Excellent (90+)</span>
            <span>⬤ Good (75-89)</span>
            <span>⬤ Fair (50-74)</span>
            <span>⬤ Poor (&lt;50)</span>
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

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "indigo" | "red";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${colorMap[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
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
