import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { useSession } from "@/lib/auth-client";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { EmailNotificationsSection } from "@/components/notifications/email-notifications-section";
import { SlackNotificationsSection } from "@/components/notifications/slack-notifications-section";
import { DiscordNotificationsSection } from "@/components/notifications/discord-notifications-section";
import { EmailRecipientsList } from "@/components/notifications/email-recipients-list";
import { useEffect, useState } from "react";
import { Slack, Discord } from "@ridemountainpig/svgl-react";
import { Button, Icon, Modal } from "@formdrop/ui";

export const Route = createFileRoute("/(app)/app/forms/$id/notifications")({
  head: () => ({
    meta: [{ title: "Notifications | FormDrop" }],
  }),
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      success: (search.success as string) || undefined,
    };
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { success } = Route.useSearch();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (success === "slack_connected" || success === "discord_connected") {
      setShowSuccessModal(true);
    }
  }, [success]);

  const { data: form, isLoading: isFormLoading } = useQuery({
    queryKey: ["form", id],
    queryFn: async () => {
      const response = await appClient.forms.get(id);
      if ("error" in response) throw new Error(response.error);
      return response.form;
    },
  });

  const { data: recipients, isLoading: isRecipientsLoading } = useQuery({
    queryKey: ["recipients", id],
    queryFn: async () => {
      const response = await appClient.recipients.list(id);
      if ("error" in response) throw new Error(response.error);
      return response.recipients;
    },
  });

  if (isFormLoading || isRecipientsLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="flex items-center gap-x-3 py-2 mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-ink-100"></div>
          <div className="h-4 w-64 animate-pulse rounded bg-ink-100"></div>
        </div>
        <div className="space-y-8">
          <div className="h-24 w-full animate-pulse rounded-panel bg-ink-100"></div>
          <div className="h-64 w-full animate-pulse rounded-panel bg-ink-100"></div>
        </div>
      </div>
    );
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate({
      to: "/app/forms/$id/notifications",
      params: { id },
      search: { success: undefined },
      replace: true,
    });
  };

  const getModalContent = () => {
    if (success === "slack_connected") {
      return {
        title: "Slack Connected!",
        description:
          "Your Slack workspace has been successfully connected. You'll now receive notifications in your selected channel.",
        icon: <Slack width={64} height={64} />,
        bgColor: "bg-purple-50",
        accentColor: "bg-purple-600",
        hoverColor: "hover:bg-purple-700",
        checkBgColor: "bg-purple-100",
        checkIconColor: "text-purple-600",
      };
    }
    if (success === "discord_connected") {
      return {
        title: "Discord Connected!",
        description:
          "Your Discord server has been successfully connected. You'll now receive notifications in your selected channel.",
        icon: <Discord width={64} height={64} />,
        bgColor: "bg-indigo-50",
        accentColor: "bg-indigo-600",
        hoverColor: "hover:bg-indigo-700",
        checkBgColor: "bg-indigo-100",
        checkIconColor: "text-indigo-600",
      };
    }
    return null;
  };

  const modalContent = getModalContent();

  return (
    <>
      <Modal
        isOpen={Boolean(showSuccessModal && modalContent)}
        onClose={handleCloseModal}
        label={modalContent?.title}
        scrim="bg-black/50 backdrop-blur-sm"
      >
        {/* The old shell rendered nothing until modalContent existed, which
            narrowed it for the whole body. The shell is always mounted now, so
            the guard moves inside. */}
        {modalContent && (
          <div className="p-10">
            <div className="flex flex-col items-center text-center">
              {/* Icon with gradient background */}
              <div
                className={`w-24 h-24 ${modalContent.bgColor} rounded-panel flex items-center justify-center mb-6`}
              >
                {modalContent.icon}
              </div>

              {/* Success checkmark badge */}
              <div
                className={`w-12 h-12 ${modalContent.checkBgColor} rounded-full flex items-center justify-center mb-5`}
              >
                <Icon
                  icon={Tick02Icon}
                  size={24}
                  className={modalContent.checkIconColor}
                />
              </div>

              {/* Title */}
              <h3 className="mb-3 text-2xl font-semibold tracking-[-0.02em] text-ink-950">
                {modalContent.title}
              </h3>

              {/* Description */}
              <p className="mb-8 text-sm leading-relaxed text-ink-600">
                {modalContent.description}
              </p>

              {/* Button */}
              <Button
                onClick={handleCloseModal}
                variant="primary"
                size="lg"
                className={`${modalContent.accentColor} ${modalContent.hoverColor} text-white rounded-full w-full transition-transform active:scale-[0.98]`}
              >
                Got it!
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Where a submission goes the moment it arrives.
          </p>
        </div>

        {/* Four cards in a row read as four equal choices. They are not: email
            is on by default and owns the recipient list beneath it, while
            Slack and Discord are optional channels you connect. The grouping
            says so. */}
        <p className="mb-3 text-xs font-medium tracking-wide text-ink-500 uppercase">
          Email
        </p>

        <EmailNotificationsSection
          formId={id}
          isEnabled={form?.emailNotificationsEnabled}
        />

        {form?.emailNotificationsEnabled && (
          <EmailRecipientsList
            formId={id}
            ownerEmail={session?.user?.email}
            recipients={recipients || []}
          />
        )}

        <p className="mt-8 mb-3 text-xs font-medium tracking-wide text-ink-500 uppercase">
          Channels
        </p>

        <SlackNotificationsSection
          isConnected={form?.slackConnected ?? false}
          isEnabled={form?.slackNotificationsEnabled}
          channelName={form?.slackChannelName}
          teamName={form?.slackTeamName}
          formId={id}
        />

        <DiscordNotificationsSection
          isConnected={form?.discordConnected ?? false}
          isEnabled={form?.discordNotificationsEnabled}
          channelName={form?.discordChannelName}
          guildName={form?.discordGuildName}
          formId={id}
        />
      </div>
    </>
  );
}
