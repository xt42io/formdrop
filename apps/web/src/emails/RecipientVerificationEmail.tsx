import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { palette } from "@formdrop/ui";

interface RecipientVerificationEmailProps {
  verificationLink: string;
  formName: string;
}

export const RecipientVerificationEmail = ({
  verificationLink,
  formName,
}: RecipientVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Verify your email to receive notifications from {formName}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>FormDrop</Heading>
        <Text style={text}>
          You've been added to receive email notifications for submissions to{" "}
          <strong>{formName}</strong>.
        </Text>
        <Text style={text}>
          To start receiving these notifications, please verify your email
          address by clicking the button below:
        </Text>
        <Section style={buttonContainer}>
          <Link style={button} href={verificationLink}>
            Verify Email Address
          </Link>
        </Section>
        <Text style={text}>Or copy and paste this URL into your browser:</Text>
        <Text style={link}>{verificationLink}</Text>
        <Text style={footer}>
          This link will expire in 24 hours. If you didn't request to receive
          these notifications, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

/*
 * Inline style objects with literal values, not classes and not custom
 * properties: this renders in mail clients, where `var()` is unsupported and a
 * class may never arrive. The values come from packages/ui so the email still
 * follows the brand when the ramp moves.
 */
const main = {
  backgroundColor: palette["ink-50"],
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "white",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: palette["accent-500"],
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: palette["ink-800"],
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 40px",
};

const buttonContainer = {
  padding: "27px 0 27px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: palette["accent-500"],
  borderRadius: "8px",
  color: "white",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const link = {
  color: palette["accent-500"],
  fontSize: "14px",
  textDecoration: "underline",
  margin: "16px 40px",
  wordBreak: "break-all" as const,
};

const footer = {
  color: palette["ink-500"],
  fontSize: "12px",
  lineHeight: "16px",
  margin: "16px 40px",
};

export default RecipientVerificationEmail;
