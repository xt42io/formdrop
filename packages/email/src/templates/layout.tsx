import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { palette } from "@formdrop/ui/palette";
import type { ReactNode } from "react";

/**
 * The shell every FormDrop email renders inside.
 *
 * One layout rather than four, so the product looks like one product in an
 * inbox -- the inline HTML this replaces had its own spacing, its own greys
 * and its own idea of a footer in each of the three places that sent mail.
 *
 * Colours come from @formdrop/ui/palette. Mail clients do not support custom
 * properties, so a literal hex is what goes down the wire; importing the
 * value keeps it tied to tokens.css and the drift test that guards it,
 * instead of being a copy nobody updates.
 *
 * Styles are inline objects because that is the only thing that survives
 * Gmail, which strips <style> blocks.
 */

const main = {
  backgroundColor: palette["ink-50"],
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "32px 0",
};

const container = {
  backgroundColor: palette.canvas,
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "600px",
  padding: "32px",
};

const wordmark = {
  color: palette["ink-950"],
  fontSize: "18px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  margin: "0 0 24px",
};

const divider = {
  borderColor: palette["ink-200"],
  margin: "32px 0 16px",
};

const footerText = {
  color: palette["ink-500"],
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
};

export interface EmailLayoutProps {
  /** The inbox preview line. Worth setting: without it clients improvise. */
  preview: string;
  children: ReactNode;
  /**
   * Replaces the default footer.
   *
   * Notification emails need an unsubscribe-shaped line that transactional
   * ones must not have, which is the only reason this is configurable.
   */
  footer?: ReactNode;
}

export function EmailLayout({ preview, children, footer }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={wordmark}>FormDrop</Text>

          {children}

          <Hr style={divider} />
          <Section>
            {footer ?? (
              <Text style={footerText}>
                Sent by FormDrop because of activity on your account.
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** Shared text styles, so four templates cannot drift into four type scales. */
export const text = {
  heading: {
    color: palette["ink-950"],
    fontSize: "20px",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: "28px",
    margin: "0 0 12px",
  },
  body: {
    color: palette["ink-600"],
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  },
  muted: {
    color: palette["ink-500"],
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 8px",
  },
  button: {
    backgroundColor: palette["accent-500"],
    borderRadius: "10px",
    color: palette.canvas,
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "12px 24px",
    textDecoration: "none",
  },
} as const;
