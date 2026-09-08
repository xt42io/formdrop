import { Button } from "./button";
import { Toggle } from "./toggle";

/**
 * A notification channel as one row: icon, name, what it is doing right now,
 * and the controls for it.
 *
 * The email, Slack and Discord sections were three files with the same shell,
 * the same hand-rolled switch and the same disconnect button, differing only
 * in an icon, two strings and which mutation the toggle called. What is left
 * at each call site is that difference.
 *
 * A channel with no `onConnect` is one that is always available -- email --
 * and renders as a toggle alone.
 */
interface IntegrationCardProps {
  icon: React.ReactNode;
  /** Background and text colour for the icon disc, e.g. "bg-purple-100 text-purple-600". */
  iconClassName?: string;
  title: string;
  description: React.ReactNode;

  isEnabled: boolean;
  onToggle: () => void;
  isToggling?: boolean;

  /** Omit for a channel that needs no connecting. */
  isConnected?: boolean;
  onConnect?: () => void;
  connectLabel?: string;
  connectIcon?: React.ReactNode;
  /** Brand colour for the connect button, e.g. "bg-purple-600 hover:bg-purple-700". */
  connectClassName?: string;
  connectRequiresPro?: boolean;

  onDisconnect?: () => void;
  isDisconnecting?: boolean;

  className?: string;
}

export function IntegrationCard({
  icon,
  iconClassName = "bg-accent-500/10 text-accent",
  title,
  description,
  isEnabled,
  onToggle,
  isToggling = false,
  isConnected,
  onConnect,
  connectLabel,
  connectIcon,
  connectClassName = "",
  connectRequiresPro = false,
  onDisconnect,
  isDisconnecting = false,
  className = "",
}: IntegrationCardProps) {
  // No connect action at all means the channel is always available.
  const needsConnecting = onConnect !== undefined && !isConnected;

  return (
    <div
      className={`bg-white rounded-3xl border border-ink-200 overflow-hidden ${className}`}
    >
      {/* Stacks below sm. Side by side, the actions kept their full width
          while the description -- the only part that can reflow -- absorbed
          every pixel of the squeeze, so a two-line summary became five lines
          against a "Coming Soon" pill that had itself wrapped in half. */}
      <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${iconClassName}`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-ink-950">{title}</h3>
            <p className="text-sm text-ink-500">{description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {needsConnecting ? (
            <Button
              onClick={onConnect}
              requiresPro={connectRequiresPro}
              className={`rounded-3xl py-3 ${connectClassName}`}
              icon={connectIcon}
            >
              {connectLabel}
            </Button>
          ) : (
            <>
              <Toggle
                checked={isEnabled}
                onChange={onToggle}
                disabled={isToggling}
                label={title}
              />
              {onDisconnect && (
                <Button
                  onClick={onDisconnect}
                  disabled={isDisconnecting}
                  variant="ghost"
                  size="sm"
                  className="text-ink-600 hover:text-ink-800 hover:bg-ink-100 rounded-xl"
                >
                  Disconnect
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
