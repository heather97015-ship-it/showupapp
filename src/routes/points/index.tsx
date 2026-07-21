import { createFileRoute, Link } from "@tanstack/react-router";
import { getLeaderboard } from "~/lib/points";

export const Route = createFileRoute("/points/")({
  loader: () => getLeaderboard(),
  component: Leaderboard,
});

function Leaderboard() {
  const entries = Route.useLoaderData();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Points Leaderboard</h1>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No cleaners with points yet.</div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 podium */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {entries.slice(0, 3).map((entry, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <Link
                  key={entry.id}
                  to="/points/$cleanerId"
                  params={{ cleanerId: entry.id }}
                  className={`bg-white rounded-xl border p-4 text-center hover:shadow-sm transition ${
                    i === 0 ? "ring-2 ring-yellow-400" : ""
                  }`}
                >
                  <div className="text-2xl mb-1">{medals[i]}</div>
                  <div className="font-semibold text-sm truncate">{entry.name}</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">{entry.points_balance}</div>
                  <div className="text-xs text-gray-400">points</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {entry.reliability_score}% reliability
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Full list */}
          {entries.slice(3).map((entry, i) => (
            <Link
              key={entry.id}
              to="/points/$cleanerId"
              params={{ cleanerId: entry.id }}
              className="flex items-center gap-4 bg-white rounded-xl border p-4 hover:shadow-sm transition"
            >
              <div className="w-8 text-center text-lg font-bold text-gray-400">{i + 4}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{entry.name}</div>
                <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                  <span className="text-green-600">{entry.on_time_count} on-time</span>
                  <span className="text-orange-600">{entry.backup_count} backups</span>
                  {entry.no_show_count > 0 && (
                    <span className="text-red-600">{entry.no_show_count} no-shows</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-600">{entry.points_balance}</div>
                <div className="text-xs text-gray-400">{entry.reliability_score}%</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
