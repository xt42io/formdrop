import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { IntegrationCard } from "@formdrop/ui";
import { useFormUpdate } from "@/hooks/use-form-mutations";

interface EmailNotificationsSectionProps {
  formId: string;
  isEnabled?: boolean;
}

export function EmailNotificationsSection({
  formId,
  isEnabled,
}: EmailNotificationsSectionProps) {
  const updateFormMutation = useFormUpdate(formId);

  return (
    <IntegrationCard
      className="mb-8"
      icon={<HugeiconsIcon icon={Notification01Icon} size={20} />}
      title="Email Notifications"
      description="Receive an email whenever a new submission is received."
      isEnabled={Boolean(isEnabled)}
      isToggling={updateFormMutation.isPending}
      // No connect step: email is always available, so the card is a toggle.
      onToggle={() =>
        updateFormMutation.mutate({ emailNotificationsEnabled: !isEnabled })
      }
    />
  );
}
