import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  ReloadIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";

import { Button, Toggle, Tooltip } from "@formdrop/ui";

/**
 * A view model rather than a database row, so it is declared rather than
 * derived. The timestamps are ISO strings because that is what survives
 * Response.json() — they were typed as Date here, which only ever worked
 * because `new Date(string)` also parses.
 */
interface RecipientStatus {
  type: "pending" | "expired" | "verified";
  verifiedAt?: string | null;
  verificationTokenExpiresAt?: string | null;
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

function formatDate(date: string) {
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
  // gap-3 and min-w-0 are what keep the actions on screen. Nothing in this row
  // could shrink, so a long address or a two-word status badge pushed the
  // toggle and the delete button clean off the right edge -- the panel grew a
  // horizontal scrollbar rather than the row adapting.
  return (
    <div className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-ink-50">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-ink-100 flex items-center justify-center text-ink-500">
          <HugeiconsIcon icon={Mail01Icon} size={16} />
        </div>
        {/* Wraps: the badge drops under the address rather than stealing its
            width, which matters most for "Invitation Expired" -- the longest
            of the three, and the one whose resend button sits beside it. */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-medium text-ink-950">
            {email}
          </span>

          {status.type === "pending" && (
            <Tooltip
              content={
                <div className="text-center">
                  <div className="font-medium">Pending Verification</div>
                  <div className="text-ink-300 text-xs mt-1">
                    Expires:{" "}
                    {status.verificationTokenExpiresAt &&
                      formatDate(status.verificationTokenExpiresAt)}
                  </div>
                </div>
              }
            >
              <span className="shrink-0 rounded-full px-2 py-0.5 whitespace-nowrap bg-tint-amber text-xs font-medium text-tint-amber-ink">
                Pending Verification
              </span>
            </Tooltip>
          )}

          {status.type === "expired" && (
            <Tooltip
              content={
                <div className="text-center">
                  <div className="font-medium">Invitation Expired</div>
                  <div className="text-ink-300 text-xs mt-1">
                    Click the resend button to send a new invitation
                  </div>
                </div>
              }
            >
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 rounded-full px-2 py-0.5 whitespace-nowrap bg-tint-rose text-xs font-medium text-tint-rose-ink">
                  Invitation Expired
                </span>
                <Button
                  onClick={onResendVerification}
                  disabled={isResending}
                  variant="ghost"
                  size="sm"
                  className="text-tint-rose-ink hover:text-tint-rose-ink hover:bg-tint-rose p-1 h-auto rounded"
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
                  <div className="text-ink-300 text-xs mt-1">
                    Verified on:{" "}
                    {status.verifiedAt && formatDate(status.verifiedAt)}
                  </div>
                </div>
              }
            >
              <span className="shrink-0 rounded-full px-2 py-0.5 whitespace-nowrap bg-tint-green text-xs font-medium text-tint-green-ink">
                Verified
              </span>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {/* An unverified recipient reads as off even when the row says
            enabled, so `checked` is narrowed here rather than in Toggle. */}
        <Toggle
          size="sm"
          checked={enabled && !isToggleDisabled}
          onChange={onToggle}
          disabled={isToggleDisabled}
          label={`Email notifications for ${email}`}
        />
        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="hover:text-tint-rose-ink hover:bg-tint-rose p-2 h-auto"
          icon={<HugeiconsIcon icon={Delete02Icon} size={16} />}
        />
      </div>
    </div>
  );
}
