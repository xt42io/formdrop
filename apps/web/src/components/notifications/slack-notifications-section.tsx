import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { Slack } from "@ridemountainpig/svgl-react";
import { IntegrationCard } from "@formdrop/ui";
import { useFormUpdate, useDisconnectSlack } from "@/hooks/use-form-mutations";

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

  return (
    <IntegrationCard
      className="mb-8"
      icon={<Slack className="size-7" />}
      iconClassName="bg-purple-100 text-purple-600"
      title="Slack Notifications"
      description={
        isConnected
          ? `Connected to #${channelName} (${teamName})`
          : "Send notifications to a Slack channel"
      }
      isConnected={isConnected}
      isEnabled={Boolean(isEnabled)}
      isToggling={updateFormMutation.isPending}
      onToggle={() =>
        updateFormMutation.mutate({ slackNotificationsEnabled: !isEnabled })
      }
      onDisconnect={() => disconnectSlackMutation.mutate()}
      isDisconnecting={disconnectSlackMutation.isPending}
      onConnect={() => {
        window.location.href = `/api/integrations/slack/authorize?formId=${formId}`;
      }}
      connectLabel="Connect Slack"
      connectIcon={<HugeiconsIcon icon={LinkSquare02Icon} size={16} />}
      connectClassName="bg-purple-600 hover:bg-purple-700"
      connectRequiresPro
    />
  );
}
