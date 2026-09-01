import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { Slack } from "@ridemountainpig/svgl-react";
import { useFormUpdate, useDisconnectSlack } from "@/hooks/use-form-mutations";

import { Button } from "@/components/button";

interface SlackNotificationsSectionProps {
  isConnected: boolean;
  isEnabled?: boolean;
  channelName?: string | null;
  teamName?: string | null;
  formId: string;
}

export function SlackNotificationsSection({
  isConnected,
  isEnabled,
  channelName,
  teamName,
  formId,
}: SlackNotificationsSectionProps) {
  const updateFormMutation = useFormUpdate(formId);
  const disconnectSlackMutation = useDisconnectSlack(formId);

  const handleToggle = () => {
    updateFormMutation.mutate({
      slackNotificationsEnabled: !isEnabled,
    });
  };

  const handleDisconnect = () => {
    disconnectSlackMutation.mutate();
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden mb-8">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Slack className="size-7" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Slack Notifications
            </h3>
            <p className="text-sm text-gray-500">
              {isConnected
                ? `Connected to #${channelName} (${teamName})`
                : "Send notifications to a Slack channel"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <button
                onClick={handleToggle}
                disabled={updateFormMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                  isEnabled ? "bg-accent" : "bg-gray-200"
                } ${updateFormMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <Button
                onClick={handleDisconnect}
                disabled={disconnectSlackMutation.isPending}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              onClick={() =>
                (window.location.href = `/api/integrations/slack/authorize?formId=${formId}`)
              }
              requiresPro
              className="bg-purple-600 hover:bg-purple-700 rounded-3xl py-3"
              icon={<HugeiconsIcon icon={LinkSquare02Icon} size={16} />}
            >
              Connect Slack
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
