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
  iconClassName = "bg-accent/10 text-accent",
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
      className={`bg-white rounded-3xl border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${iconClassName}`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl"
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
