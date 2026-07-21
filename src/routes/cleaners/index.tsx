import { createFileRoute, Link } from "@tanstack/react-router";
import { listCleaners } from "~/lib/cleaners";
import { getAllCleanersMonthlyStats } from "~/lib/cleaners";
import { useState } from "react";

export const Route = createFileRoute("/cleaners/")({
  loader: async () => {
    const [cleaners, stats] = await Promise.all([
      listCleaners(),
      getAllCleanersMonthlyStats(),
    ]);
    return { cleaners, stats };
  },
  component: CleanersList,
});

function getRingColor(score: number): string {
  if (score >= 90) return "ring-2 ring-amber-400 ring-offset-2 bg-amber-50";
  if (score >= 75) return "ring-2 ring-green-500 ring-offset-2 bg-green-50";
  if (score >= 50) return "ring-2 ring-amber-500 ring-offset-2 bg-amber-50";
  return "ring-2 ring-red-500 ring-offset-2 bg-red-50";
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function CleanersList() {
  const { cleaners, stats } = Route.useLoaderData();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cleaners</h1>
        <Link
          to="/cleaners/new"
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-indigo-700"
        >
          + Add Cleaner
        </Link>
      </div>

      {cleaners.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No cleaners yet</p>
          <p className="text-sm mt-1">Add your first cleaner to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cleaners.map((c) => {
            const cleanerStats = stats[c.id];
            return (
              <Link
                key={c.id}
                to="/cleaners/$cleanerId"
                params={{ cleanerId: c.id }}
                className="block bg-white rounded-xl border-2 p-4 hover:shadow-md hover:border-indigo-300 transition relative"
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Reliability Ring with Initials */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold ${getRingColor(c.reliability_score)}`}
                    >
                      {getInitial(c.name)}
                    </div>
                    <div>
                      <div className="font-bold text-lg">
                        {c.name}
                        {!c.is_active && (
                          <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {c.email || c.phone || "No contact"}
                      </div>
                      {cleanerStats && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {cleanerStats.total_jobs > 0
                            ? `${cleanerStats.on_time_pct}% on-time (${cleanerStats.total_jobs} jobs this month)`
                            : "No jobs this month"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-indigo-600">{c.points_balance}</div>
                    <div className="text-xs text-gray-400 font-medium">points</div>
                  </div>
                </div>

                {/* Tooltip on hover */}
                {hoveredId === c.id && cleanerStats && cleanerStats.total_jobs > 0 && (
                  <div className="absolute top-full left-4 mt-1 z-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                    {c.name}: {cleanerStats.on_time_pct}% On-time, {cleanerStats.no_shows} No-Shows this month
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
