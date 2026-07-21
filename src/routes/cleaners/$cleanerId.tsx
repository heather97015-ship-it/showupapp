import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getCleaner, updateCleaner, toggleCleanerActive, type Cleaner } from "~/lib/cleaners";
import { getCleanerPointsHistory } from "~/lib/points";
import { useState } from "react";

export const Route = createFileRoute("/cleaners/$cleanerId")({
  loader: async ({ params }) => {
    const cleaner = await getCleaner({ data: params.cleanerId });
    if (!cleaner) throw new Error("Cleaner not found");
    const history = await getCleanerPointsHistory({ data: params.cleanerId });
    return { cleaner, history };
  },
  component: CleanerDetail,
});

function CleanerDetail() {
  const { cleaner, history } = Route.useLoaderData();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cleaner.name);
  const [phone, setPhone] = useState(cleaner.phone ?? "");
  const [email, setEmail] = useState(cleaner.email ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateCleaner({
        data: {
          id: cleaner.id,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          is_active: cleaner.is_active,
        },
      });
      // Reload by navigating (triggers loader refresh)
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    await toggleCleanerActive({
      data: { id: cleaner.id, is_active: !cleaner.is_active },
    });
    window.location.reload();
  }

  const scoreColor =
    cleaner.reliability_score >= 90
      ? "text-green-600"
      : cleaner.reliability_score >= 75
        ? "text-blue-600"
        : cleaner.reliability_score >= 50
          ? "text-yellow-600"
          : "text-red-600";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Cleaner card */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl font-bold border rounded px-2 py-1 w-full"
              />
            ) : (
              <h1 className="text-xl font-bold">{cleaner.name}</h1>
            )}
            <div className="text-sm text-gray-500 mt-1">
              {editing ? (
                <div className="space-y-2 mt-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone"
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
              ) : (
                <>
                  {cleaner.phone && <div>📞 {cleaner.phone}</div>}
                  {cleaner.email && <div>✉️ {cleaner.email}</div>}
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${scoreColor}`}>{cleaner.reliability_score}</div>
            <div className="text-xs text-gray-400">Reliability</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-indigo-700">{cleaner.points_balance}</div>
            <div className="text-xs text-indigo-500">Points</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{history.length}</div>
            <div className="text-xs text-gray-500">Transactions</div>
          </div>
        </div>

        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                onClick={handleToggleActive}
                className={`flex-1 border rounded-lg py-2 text-sm font-medium ${
                  cleaner.is_active
                    ? "text-red-600 border-red-200 hover:bg-red-50"
                    : "text-green-600 border-green-200 hover:bg-green-50"
                }`}
              >
                {cleaner.is_active ? "Deactivate" : "Activate"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Points history */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Points History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">No points transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((tx) => (
              <div key={tx.id} className="bg-white rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium capitalize">
                    {tx.reason.replace(/_/g, " ")}
                  </div>
                  {tx.job_title && (
                    <div className="text-xs text-gray-400">{tx.job_title}</div>
                  )}
                  <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
                <div className={`text-lg font-bold ${tx.points >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {tx.points >= 0 ? "+" : ""}
                  {tx.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
