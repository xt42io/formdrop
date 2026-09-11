import { Section, Text } from "@react-email/components";
import { palette } from "@formdrop/ui/palette";
import { EmailLayout, text } from "./layout.tsx";

const codeBox = {
  backgroundColor: palette["ink-50"],
  borderRadius: "10px",
  margin: "0 0 20px",
  padding: "20px",
  textAlign: "center" as const,
};

const code = {
  color: palette["ink-950"],
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "32px",
  fontWeight: 700,
  letterSpacing: "0.2em",
  lineHeight: "40px",
  margin: 0,
};

export interface OtpEmailProps {
  code: string;
  /** Minutes the code stays valid, so the reader knows whether to hurry. */
  expiresInMinutes: number;
}

/** Sign-in and email verification codes, from Better Auth's emailOTP. */
export function OtpEmail({ code: value, expiresInMinutes }: OtpEmailProps) {
  return (
    <EmailLayout preview={`${value} is your FormDrop code`}>
      <Text style={text.heading}>Your sign-in code</Text>
      <Text style={text.body}>
        Enter this code to continue. It expires in {expiresInMinutes} minutes.
      </Text>

      <Section style={codeBox}>
        <Text style={code}>{value}</Text>
      </Section>

      <Text style={text.muted}>
        If you did not ask for this code, you can ignore this email. Nobody can
        sign in without it.
      </Text>
    </EmailLayout>
  );
}
