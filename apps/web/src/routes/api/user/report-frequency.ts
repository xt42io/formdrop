import { createFileRoute } from "@tanstack/react-router";
import { findReportFrequency, setReportFrequency } from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

const CHOICES = ["off", "weekly", "monthly"] as const;
type Choice = (typeof CHOICES)[number];

const isChoice = (value: unknown): value is Choice =>
  typeof value === "string" && (CHOICES as readonly string[]).includes(value);

/**
 * How often this account gets its summary email (PRD W7).
 *
 * Scoped to the session's own account throughout: the id never comes from the
 * request body, so nobody can change somebody else's preference.
 */
const GET = async ({ request }: { request: Request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return json({ error: "Unauthorized" }, { status: 401 });

  const frequency = await findReportFrequency(session.user.id);
  return json({ frequency: frequency ?? "weekly" });
};

const PATCH = async ({ request }: { request: Request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    frequency?: unknown;
  } | null;

  // The column is an enum, so an unknown value would be a 500 from Postgres
  // rather than a 400 that says why.
  if (!isChoice(body?.frequency)) {
    return json(
      { error: `frequency must be one of: ${CHOICES.join(", ")}` },
      { status: 400 },
    );
  }

  await setReportFrequency(session.user.id, body.frequency);
  return json({ frequency: body.frequency });
};

export type ReportFrequencyGetResponse = HandlerPayload<typeof GET>;
export type ReportFrequencyPatchResponse = HandlerPayload<typeof PATCH>;

export const Route = createFileRoute("/api/user/report-frequency")({
  server: { handlers: { GET, PATCH } },
});
