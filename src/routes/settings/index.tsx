import { createFileRoute } from "@tanstack/react-router";
import { getSettings, updateSettings } from "~/lib/settings";
import { useState } from "react";

export const Route = createFileRoute("/settings/")({
  loader: () => getSettings(),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = Route.useLoaderData();
  const [businessName, setBusinessName] = useState(settings.business_name ?? "");
  const [ownerEmail, setOwnerEmail] = useState(settings.owner_email ?? "");
  const [ownerPhone, setOwnerPhone] = useState(settings.owner_phone ?? "");
  const [backupAutoDeploy, setBackupAutoDeploy] = useState(settings.backup_auto_deploy);
  const [pointsOnTime, setPointsOnTime] = useState(settings.points_per_on_time);
  const [pointsBackup, setPointsBackup] = useState(settings.points_per_backup);
  const [penaltyNoShow, setPenaltyNoShow] = useState(settings.penalty_for_no_show);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateSettings({
        data: {
          business_name: businessName.trim() || undefined,
          owner_email: ownerEmail.trim() || undefined,
          owner_phone: ownerPhone.trim() || undefined,
          backup_auto_deploy: backupAutoDeploy,
          points_per_on_time: pointsOnTime,
          points_per_backup: pointsBackup,
          penalty_for_no_show: penaltyNoShow,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-sm text-gray-500 uppercase">Business</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="ShowUp"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@example.com"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Phone <span className="text-gray-400 font-normal">(for SMS alerts)</span>
            </label>
            <input
              type="tel"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="+15551234567"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Points configuration */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-sm text-gray-500 uppercase">Points Configuration</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points per On-Time Job
            </label>
            <input
              type="number"
              value={pointsOnTime}
              onChange={(e) => setPointsOnTime(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points per Backup Shift
            </label>
            <input
              type="number"
              value={pointsBackup}
              onChange={(e) => setPointsBackup(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penalty for No-Show
            </label>
            <input
              type="number"
              value={penaltyNoShow}
              onChange={(e) => setPenaltyNoShow(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Auto-deploy Backup</label>
            <button
              type="button"
              onClick={() => setBackupAutoDeploy(!backupAutoDeploy)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                backupAutoDeploy ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  backupAutoDeploy ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm text-center">
            ✓ Settings saved
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
