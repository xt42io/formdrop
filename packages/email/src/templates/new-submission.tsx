import { Button, Section, Text } from "@react-email/components";
import { palette } from "@formdrop/ui/palette";
import { EmailLayout, text } from "./layout.tsx";

const panel = {
  backgroundColor: palette["ink-50"],
  borderRadius: "12px",
  margin: "0 0 20px",
  padding: "24px",
};

const fieldLabel = {
  color: palette["ink-500"],
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.05em",
  lineHeight: "16px",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
};

const fieldValue = {
  color: palette["ink-950"],
  fontSize: "15px",
  lineHeight: "22px",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

/**
 * A submitted value, as text.
 *
 * The payload is whatever the customer's form defined, so this has to cope
 * with an array, a nested object or a number without throwing -- and it must
 * never produce markup. The inline HTML this template replaces interpolated
 * values straight into a string, which meant a submission containing a tag
 * put that tag in the notification. React escapes children, so returning a
 * string here is what closes that.
 */
function present(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.map(present).join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export interface NewSubmissionEmailProps {
  formName: string;
  payload: Record<string, unknown>;
  /** Deep link to the submission in the dashboard, when there is one. */
  submissionUrl?: string;
}

export function NewSubmissionEmail({
  formName,
  payload,
  submissionUrl,
}: NewSubmissionEmailProps) {
  const fields = Object.entries(payload);

  return (
    <EmailLayout
      preview={`New submission for ${formName}`}
      footer={
        <Text style={{ ...text.muted, margin: 0 }}>
          You are receiving this because this address is a notification
          recipient for {formName}. Turn it off in the form&apos;s Notifications
          tab.
        </Text>
      }
    >
      <Text style={text.heading}>New submission for {formName}</Text>

      <Section style={panel}>
        {fields.length === 0 ? (
          // A form can be posted with no fields at all. Saying so beats an
          // empty grey box that looks like the email failed to render.
          <Text style={fieldValue}>
            This submission arrived with no fields.
          </Text>
        ) : (
          fields.map(([key, value]) => (
            <Section key={key} style={{ marginBottom: "16px" }}>
              <Text style={fieldLabel}>{key}</Text>
              <Text style={fieldValue}>{present(value)}</Text>
            </Section>
          ))
        )}
      </Section>

      {submissionUrl ? (
        <Section>
          <Button href={submissionUrl} style={text.button}>
            View in dashboard
          </Button>
        </Section>
      ) : null}
    </EmailLayout>
  );
}
