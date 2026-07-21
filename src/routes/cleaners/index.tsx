import { createFileRoute, Link } from "@tanstack/react-router";
import { listCleaners } from "~/lib/cleaners";

export const Route = createFileRoute("/cleaners/")({
  loader: () => listCleaners(),
  component: CleanersList,
});

function CleanersList() {
  const cleaners = Route.useLoaderData();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cleaners</h1>
        <Link
          to="/cleaners/new"
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700"
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
          {cleaners.map((c) => (
            <Link
              key={c.id}
              to="/cleaners/$cleanerId"
              params={{ cleanerId: c.id }}
              className="block bg-white rounded-xl border p-4 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      c.reliability_score >= 90
                        ? "bg-green-500"
                        : c.reliability_score >= 75
                          ? "bg-blue-500"
                          : c.reliability_score >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                    }`}
                  >
                    {c.reliability_score}
                  </div>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-500">
                      {c.email || c.phone || "No contact"}
                      {!c.is_active && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-indigo-600">{c.points_balance} pts</div>
                  <div className="text-xs text-gray-400">
                    {c.reliability_score >= 90
                      ? "Excellent"
                      : c.reliability_score >= 75
                        ? "Good"
                        : c.reliability_score >= 50
                          ? "Fair"
                          : "Poor"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
