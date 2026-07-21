import { createFileRoute } from "@tanstack/react-router";
import { getCleanerPointsHistory } from "~/lib/points";
import { getCleaner } from "~/lib/cleaners";

export const Route = createFileRoute("/points/$cleanerId")({
  loader: async ({ params }) => {
    const [cleaner, history] = await Promise.all([
      getCleaner({ data: params.cleanerId }),
      getCleanerPointsHistory({ data: params.cleanerId }),
    ]);
    if (!cleaner) throw new Error("Cleaner not found");
    return { cleaner, history };
  },
  component: CleanerPointsHistory,
});

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  on_time: { label: "On Time", color: "text-green-600" },
  backup_shift: { label: "Backup Shift", color: "text-orange-600" },
  no_show: { label: "No Show", color: "text-red-600" },
  late: { label: "Late", color: "text-yellow-600" },
};

function CleanerPointsHistory() {
  const { cleaner, history } = Route.useLoaderData();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{cleaner.name}</h1>
            <p className="text-sm text-gray-500">
              {cleaner.reliability_score}% reliability
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">{cleaner.points_balance}</div>
            <div className="text-xs text-gray-400">Total Points</div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {history.filter((t) => t.points > 0).length}
            </div>
            <div className="text-xs text-gray-400">Rewards</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {history.filter((t) => t.points < 0).length}
            </div>
            <div className="text-xs text-gray-400">Penalties</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {history.reduce((sum, t) => sum + t.points, 0)}
            </div>
            <div className="text-xs text-gray-400">Net</div>
          </div>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Transaction History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((tx) => {
              const reasonInfo = REASON_LABELS[tx.reason] ?? { label: tx.reason, color: "text-gray-600" };
              return (
                <div key={tx.id} className="bg-white rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-sm font-medium ${reasonInfo.color}`}>
                        {reasonInfo.label}
                      </span>
                      {tx.job_title && (
                        <span className="text-sm text-gray-500 ml-2">· {tx.job_title}</span>
                      )}
                    </div>
                    <span className={`font-bold ${tx.points >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.points >= 0 ? "+" : ""}
                      {tx.points}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(tx.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
