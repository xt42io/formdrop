import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button, Icon } from "@formdrop/ui";
import { Alert01Icon } from "@hugeicons/core-free-icons";

interface PasswordSettingsProps {
  hasPassword?: boolean;
}

/** Better Auth's own floor. Stated up front rather than after a failed submit. */
const MIN_LENGTH = 8;

const inputClass =
  "mt-2 w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm text-ink-950 transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none";

export function PasswordSettings({ hasPassword }: PasswordSettingsProps) {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const tooShort = newPassword.length > 0 && newPassword.length < MIN_LENGTH;
  // Only complain once there is something to compare against, so the message
  // does not accuse you of a mismatch after the first keystroke.
  const mismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSubmit =
    newPassword.length >= MIN_LENGTH &&
    confirmPassword === newPassword &&
    (!hasPassword || currentPassword.length > 0);

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
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
    <div className="overflow-hidden rounded-panel border border-ink-200 bg-white">
      <div className="border-b border-ink-100 px-6 py-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-950">
          {hasPassword ? "Change password" : "Set a password"}
        </h2>
        {/* revokeOtherSessions has always been on. Saying so beforehand is the
            difference between a security feature and a surprise logout. */}
        <p className="mt-1 text-sm text-ink-600">
          Saving signs you out everywhere else.
        </p>
      </div>

      {/* A real form, so Enter submits. The three fields previously sat loose
          in a div and the keyboard did nothing at all. */}
      <form
        className="px-6 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) changePasswordMutation.mutate();
        }}
      >
        {!hasPassword && (
          <div className="mb-6 flex items-start gap-3 rounded-card border border-tint-blue bg-tint-blue/40 p-4">
            <Icon
              icon={Alert01Icon}
              className="mt-0.5 shrink-0 text-tint-blue-ink"
            />
            <p className="text-sm leading-relaxed text-tint-blue-ink">
              You signed up with a social account, so there is no password on
              this account yet. Set one to also sign in with your email.
            </p>
          </div>
        )}

        <div className="max-w-md space-y-5">
          {hasPassword && (
            <div>
              <label
                htmlFor="current-password"
                className="block text-sm font-medium text-ink-700"
              >
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                /* Without these the browser and every password manager guess,
                   and they guess badly on a three-field change form. */
                autoComplete="current-password"
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-ink-700"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              autoComplete="new-password"
              aria-describedby="new-password-hint"
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
            <p
              id="new-password-hint"
              className={`mt-2 text-xs ${tooShort ? "text-tint-rose-ink" : "text-ink-500"}`}
            >
              At least {MIN_LENGTH} characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-ink-700"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
            {/* This used to surface only as a toast, after a round trip, once
                the form had already been submitted. */}
            {mismatch && (
              <p className="mt-2 text-xs text-tint-rose-ink">
                Both fields need to match.
              </p>
            )}
          </div>

          <div className="border-t border-ink-100 pt-5">
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit}
              isLoading={changePasswordMutation.isPending}
            >
              {hasPassword ? "Update password" : "Set password"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
