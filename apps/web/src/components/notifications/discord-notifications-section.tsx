import { GameIcon } from "@hugeicons/core-free-icons";
import { Discord } from "@ridemountainpig/svgl-react";
import { Icon, IntegrationCard } from "@formdrop/ui";
import {
  useFormUpdate,
  useDisconnectDiscord,
} from "@/hooks/use-form-mutations";

interface DiscordNotificationsSectionProps {
  isConnected: boolean;
  isEnabled?: boolean;
  channelName?: string | null;
  guildName?: string | null;
  formId: string;
}

export function DiscordNotificationsSection({
  isConnected,
  isEnabled,
  channelName,
  guildName,
  formId,
}: DiscordNotificationsSectionProps) {
  const updateFormMutation = useFormUpdate(formId);
  const disconnectDiscordMutation = useDisconnectDiscord(formId);

  return (
    <IntegrationCard
      className="mb-8"
      icon={<Discord className="size-7" />}
      iconClassName="bg-indigo-100 text-indigo-600"
      title="Discord Notifications"
      description={
        isConnected
          ? `Connected to #${channelName} (${guildName})`
          : "Send notifications to a Discord channel"
      }
      isConnected={isConnected}
      isEnabled={Boolean(isEnabled)}
      isToggling={updateFormMutation.isPending}
      onToggle={() =>
        updateFormMutation.mutate({ discordNotificationsEnabled: !isEnabled })
      }
      onDisconnect={() => disconnectDiscordMutation.mutate()}
      isDisconnecting={disconnectDiscordMutation.isPending}
      onConnect={() => {
        window.location.href = `/api/integrations/discord/authorize?formId=${formId}`;
      }}
      connectLabel="Connect Discord"
      connectIcon={<Icon icon={GameIcon} size={16} />}
      connectClassName="bg-indigo-600 hover:bg-indigo-700"
      connectRequiresPro
    />
  );
}
