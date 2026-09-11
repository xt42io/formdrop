import { Button, Column, Row, Section, Text } from "@react-email/components";
import { palette } from "@formdrop/ui/palette";
import { EmailLayout, text } from "./layout.tsx";

const statCell = {
  backgroundColor: palette["ink-50"],
  borderRadius: "10px",
  padding: "16px",
  textAlign: "center" as const,
};

const statValue = {
  color: palette["ink-950"],
  fontSize: "26px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: "32px",
  margin: "0 0 2px",
};

const statLabel = {
  color: palette["ink-500"],
  fontSize: "12px",
  lineHeight: "16px",
  margin: 0,
};

const formRow = {
  borderBottom: `1px solid ${palette["ink-200"]}`,
  padding: "10px 0",
};

export interface ReportEmailProps {
  /** "week" or "month" -- the pricing page promises both. */
  period: "week" | "month";
  /** Human range, e.g. "1-7 September". Formatted by the caller, in their locale. */
  rangeLabel: string;
  submissions: number;
  /**
   * Change against the previous period, as a percentage.
   *
   * Null when there is no previous period to compare against. A first week
   * has no baseline, and showing that as "0%" would be a claim rather than
   * an absence -- the same rule the dashboard's comparison follows.
   */
  changePercent: number | null;
  /** Busiest forms, already sorted and trimmed by the caller. */
  topForms: Array<{ name: string; submissions: number }>;
  dashboardUrl: string;
}

export function ReportEmail({
  period,
  rangeLabel,
  submissions,
  changePercent,
  topForms,
  dashboardUrl,
}: ReportEmailProps) {
  const title =
    period === "week" ? "Your week on FormDrop" : "Your month on FormDrop";

  const change =
    changePercent === null
      ? "No previous period to compare"
      : `${changePercent >= 0 ? "+" : ""}${changePercent}% vs previous ${period}`;

  return (
    <EmailLayout
      preview={`${submissions} submission${submissions === 1 ? "" : "s"} in ${rangeLabel}`}
      footer={
        <Text style={{ ...text.muted, margin: 0 }}>
          You receive this summary every {period}. Turn it off in Settings →
          Notifications.
        </Text>
      }
    >
      <Text style={text.heading}>{title}</Text>
      <Text style={text.body}>{rangeLabel}</Text>

      <Section style={{ margin: "0 0 24px" }}>
        <Row>
          <Column style={statCell}>
            <Text style={statValue}>{submissions.toLocaleString()}</Text>
            <Text style={statLabel}>
              {submissions === 1 ? "submission" : "submissions"}
            </Text>
          </Column>
          <Column style={{ width: "12px" }} />
          <Column style={statCell}>
            <Text style={statValue}>{topForms.length}</Text>
            <Text style={statLabel}>
              {topForms.length === 1 ? "active form" : "active forms"}
            </Text>
          </Column>
        </Row>
      </Section>

      <Text style={text.muted}>{change}</Text>

      {topForms.length > 0 ? (
        <Section style={{ margin: "16px 0 24px" }}>
          {topForms.map((form) => (
            <Row key={form.name} style={formRow}>
              <Column>
                <Text style={{ ...text.body, margin: 0 }}>{form.name}</Text>
              </Column>
              <Column align="right">
                <Text
                  style={{
                    ...text.body,
                    fontWeight: 600,
                    margin: 0,
                    color: palette["ink-950"],
                  }}
                >
                  {form.submissions.toLocaleString()}
                </Text>
              </Column>
            </Row>
          ))}
        </Section>
      ) : (
        // A quiet period is a real outcome, and a report that hides it reads
        // as broken. Saying so plainly is better than an empty table.
        <Text style={text.body}>
          Nothing arrived this {period}. Your forms are still collecting.
        </Text>
      )}

      <Section>
        <Button href={dashboardUrl} style={text.button}>
          Open dashboard
        </Button>
      </Section>
    </EmailLayout>
  );
}
