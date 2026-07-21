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

function getRingColor(score: number): string {
  if (score >= 90) return "ring-2 ring-amber-400 ring-offset-2 bg-amber-50";
  if (score >= 75) return "ring-2 ring-green-500 ring-offset-2 bg-green-50";
  if (score >= 50) return "ring-2 ring-amber-500 ring-offset-2 bg-amber-50";
  return "ring-2 ring-red-500 ring-offset-2 bg-red-50";
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Cleaner card */}
      <div className="bg-white rounded-xl border-2 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Reliability Ring */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-extrabold ${getRingColor(cleaner.reliability_score)}`}
            >
              {getInitial(cleaner.name)}
            </div>
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
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-200">
            <div className="text-2xl font-extrabold text-indigo-700">{cleaner.points_balance}</div>
            <div className="text-xs font-medium text-indigo-500">Points</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center border">
            <div className="text-2xl font-extrabold">{history.length}</div>
            <div className="text-xs font-medium text-gray-500">Transactions</div>
          </div>
        </div>

        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 border-2 rounded-lg py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                onClick={handleToggleActive}
                className={`flex-1 border-2 rounded-lg py-2 text-sm font-bold ${
                  cleaner.is_active
                    ? "text-red-600 border-red-300 hover:bg-red-50"
                    : "text-green-600 border-green-300 hover:bg-green-50"
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
        <h2 className="text-lg font-bold mb-3">Points History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">No points transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((tx) => (
              <div key={tx.id} className="bg-white rounded-lg border-2 p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold capitalize">
                    {tx.reason.replace(/_/g, " ")}
                  </div>
                  {tx.job_title && (
                    <div className="text-xs text-gray-500">{tx.job_title}</div>
                  )}
                  <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
                <div className={`text-lg font-extrabold ${tx.points >= 0 ? "text-green-600" : "text-red-600"}`}>
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
