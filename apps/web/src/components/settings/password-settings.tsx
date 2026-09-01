import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";

interface PasswordSettingsProps {
  hasPassword?: boolean;
}

export function PasswordSettings({ hasPassword }: PasswordSettingsProps) {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await authClient.changePassword({
        currentPassword: hasPassword ? currentPassword : (null as any),
        newPassword,
        revokeOtherSessions: true,
      });
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update password");
    },
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {hasPassword ? "Change Password" : "Set Password"}
      </h2>

      {!hasPassword && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-2xl text-sm flex items-start gap-3">
          <HugeiconsIcon
            icon={Alert01Icon}
            size={20}
            className="shrink-0 mt-0.5"
          />
          <p>
            You haven't set a password yet because you signed up with a social
            account. Set a password to log in with your email.
          </p>
        </div>
      )}

      <div className="space-y-6 max-w-md">
        {hasPassword && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        <div className="pt-4">
          <Button
            variant="primary"
            size="lg"
            className="shadow-lg shadow-accent/20"
            onClick={() => changePasswordMutation.mutate()}
            isLoading={changePasswordMutation.isPending}
          >
            {hasPassword ? "Update Password" : "Set Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
