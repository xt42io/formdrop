import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, text } from "./layout.tsx";

export interface RecipientVerificationEmailProps {
  formName: string;
  verificationUrl: string;
}

/**
 * Sent when somebody adds this address as a notification recipient.
 *
 * The tone matters here in a way it does not in the other three: the reader
 * did not ask for this, and the person who added them may be a stranger. So
 * the email leads with who wants to send them mail and what they will get,
 * and makes ignoring it an explicit, consequence-free option.
 */
export function RecipientVerificationEmail({
  formName,
  verificationUrl,
}: RecipientVerificationEmailProps) {
  return (
    <EmailLayout preview={`Confirm notifications for ${formName}`}>
      <Text style={text.heading}>Confirm your address</Text>
      <Text style={text.body}>
        Somebody added this address to receive an email whenever the form{" "}
        <strong>{formName}</strong> gets a submission. Nothing will be sent
        until you confirm.
      </Text>

      <Section style={{ margin: "0 0 20px" }}>
        <Button href={verificationUrl} style={text.button}>
          Confirm this address
        </Button>
      </Section>

      <Text style={text.muted}>
        If you were not expecting this, ignore it. Without a confirmation this
        address receives nothing, and we will not email you about it again.
      </Text>
    </EmailLayout>
  );
}
