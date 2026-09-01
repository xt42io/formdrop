import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  ReloadIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { Tooltip } from "@/components/tooltip";

import { Button } from "@/components/button";

interface RecipientStatus {
  type: "pending" | "expired" | "verified";
  verifiedAt?: Date | null;
  verificationTokenExpiresAt?: Date | null;
}

interface RecipientItemProps {
  id: string;
  email: string;
  enabled: boolean;
  status: RecipientStatus;
  onToggle: () => void;
  onDelete: () => void;
  onResendVerification: () => void;
  isToggleDisabled: boolean;
  isResending: boolean;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecipientItem({
  email,
  enabled,
  status,
  onToggle,
  onDelete,
  onResendVerification,
  isToggleDisabled,
  isResending,
}: RecipientItemProps) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
          <HugeiconsIcon icon={Mail01Icon} size={16} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{email}</span>

          {status.type === "pending" && (
            <Tooltip
              content={
                <div className="text-center">
                  <div className="font-medium">Pending Verification</div>
                  <div className="text-gray-300 text-xs mt-1">
                    Expires:{" "}
                    {status.verificationTokenExpiresAt &&
                      formatDate(status.verificationTokenExpiresAt)}
                  </div>
                </div>
              }
            >
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                Pending Verification
              </span>
            </Tooltip>
          )}

          {status.type === "expired" && (
            <Tooltip
              content={
                <div className="text-center">
                  <div className="font-medium">Invitation Expired</div>
                  <div className="text-gray-300 text-xs mt-1">
                    Click the resend button to send a new invitation
                  </div>
                </div>
              }
            >
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-xs font-medium text-red-700">
                  Invitation Expired
                </span>
                <Button
                  onClick={onResendVerification}
                  disabled={isResending}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto rounded"
                  icon={<HugeiconsIcon icon={ReloadIcon} size={14} />}
                />
              </div>
            </Tooltip>
          )}

          {status.type === "verified" && (
            <Tooltip
              content={
                <div className="text-center">
                  <div className="font-medium">Verified</div>
                  <div className="text-gray-300 text-xs mt-1">
                    Verified on:{" "}
                    {status.verifiedAt && formatDate(status.verifiedAt)}
                  </div>
                </div>
              }
            >
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-xs font-medium text-green-700">
                Verified
              </span>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          disabled={isToggleDisabled}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
            enabled && !isToggleDisabled ? "bg-accent" : "bg-gray-200"
          } ${isToggleDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              enabled && !isToggleDisabled ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 h-auto"
          icon={<HugeiconsIcon icon={Delete02Icon} size={16} />}
        />
      </div>
    </div>
  );
}
