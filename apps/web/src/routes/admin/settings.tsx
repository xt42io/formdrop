import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/button";
import { useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState("");

  const handleClearOldSubmissions = async () => {
    if (
      !confirm(
        "Are you sure you want to delete submissions older than 90 days? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsClearing(true);
    setMessage("");

    try {
      const res = await axios.post("/api/admin/settings/clear-old-submissions");
      setMessage(`Successfully deleted ${res.data.deletedCount} submissions.`);
    } catch (error) {
      setMessage("Failed to clear old submissions.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage application settings and perform administrative tasks.
        </p>
      </div>

      {/* Data Management */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Data Management
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Clear Old Submissions
              </h4>
              <p className="text-sm text-gray-500">
                Delete all submissions older than 90 days
              </p>
            </div>
            <Button
              variant="danger"
              onClick={handleClearOldSubmissions}
              isLoading={isClearing}
              disabled={isClearing}
            >
              Clear Old Data
            </Button>
          </div>
          {message && (
            <div
              className={`p-4 rounded-xl ${message.includes("Successfully") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              <p className="text-sm">{message}</p>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-500">
              Application Version
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-1">v1.0.0</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-500">Database Status</p>
            <p className="text-lg font-semibold text-green-600 mt-1">
              Connected
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-500">Environment</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {process.env.NODE_ENV || "development"}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-500">Last Backup</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">N/A</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-200 rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Maintenance Mode
              </h4>
              <p className="text-sm text-gray-500">
                Enable maintenance mode to prevent users from accessing the
                application
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
