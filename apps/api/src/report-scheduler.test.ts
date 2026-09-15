import { beforeEach, describe, expect, it, vi } from "vitest";

// Parameters are typed so `mock.calls` carries them; an inferred zero-arity
// stub turns every read of a recorded argument into a cast through `unknown`.
type Props = Record<string, unknown>;

const findAccountsDueForReport = vi.fn((_q: Props) =>
  Promise.resolve([] as Props[]),
);
const reportStatsForUser = vi.fn((_q: Props) => Promise.resolve({} as Props));
const submissionsInRange = vi.fn((_q: Props) => Promise.resolve(0));
const sendEmail = vi.fn((_options: Props) => Promise.resolve({} as Props));
const ReportEmail = vi.fn((_props: Props) => null);

vi.mock("@formdrop/core/data", () => ({
  REPORT_TEMPLATE: "report",
  findAccountsDueForReport: (q: Props) => findAccountsDueForReport(q),
  reportStatsForUser: (q: Props) => reportStatsForUser(q),
  submissionsInRange: (q: Props) => submissionsInRange(q),
}));

vi.mock("@formdrop/email", () => ({
  sendEmail: (options: Props) => sendEmail(options),
  ReportEmail: (props: Props) => ReportEmail(props),
}));

const { runOnce, sendReport } = await import("./report-scheduler");

/** Wednesday 16 September 2026: the completed week is 7–13 September. */
const WEDNESDAY = new Date("2026-09-16T10:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_URL = "https://formdrop.co";
  findAccountsDueForReport.mockResolvedValue([
    { id: "u1", email: "ada@northwind.io", name: "Ada" },
  ]);
  reportStatsForUser.mockResolvedValue({
    submissions: 120,
    topForms: [{ name: "Contact", submissions: 80 }],
  });
  submissionsInRange.mockResolvedValue(100);
  sendEmail.mockResolvedValue({ messageId: "em_1" });
});

describe("sendReport", () => {
  it("reports the completed period, not the one in progress", async () => {
    await sendReport({
      account: { id: "u1", email: "ada@northwind.io" },
      frequency: "weekly",
      now: WEDNESDAY,
    });

    // A week-to-date summary would be a different thing every time it ran.
    expect(reportStatsForUser).toHaveBeenCalledWith(
      expect.objectContaining({ start: "2026-09-07", end: "2026-09-13" }),
    );
    const [props] = ReportEmail.mock.calls[0];
    expect(props.rangeLabel).toBe("7–13 September 2026");
  });

  it("compares against the period before, which does not overlap", async () => {
    await sendReport({
      account: { id: "u1", email: "ada@northwind.io" },
      frequency: "weekly",
      now: WEDNESDAY,
    });

    expect(submissionsInRange).toHaveBeenCalledWith(
      expect.objectContaining({ start: "2026-08-31", end: "2026-09-06" }),
    );

    // 120 against 100.
    const [props] = ReportEmail.mock.calls[0];
    expect(props.changePercent).toBe(20);
  });

  it("says there is no baseline rather than claiming no change", async () => {
    submissionsInRange.mockResolvedValue(0);

    await sendReport({
      account: { id: "u1", email: "ada@northwind.io" },
      frequency: "weekly",
      now: WEDNESDAY,
    });

    const [props] = ReportEmail.mock.calls[0];
    expect(props.changePercent).toBeNull();
  });

  it("keys idempotency on the account and the period", async () => {
    await sendReport({
      account: { id: "u1", email: "ada@northwind.io" },
      frequency: "weekly",
      now: WEDNESDAY,
    });

    // The email_deliveries check is a read followed by a write. This key is
    // what makes a replay harmless if those two ever interleave.
    const [options] = sendEmail.mock.calls[0];
    expect(options.idempotencyKey).toBe("report:weekly:2026-09-07:u1");
  });

  it("sends the monthly cadence with the month's own label", async () => {
    await sendReport({
      account: { id: "u1", email: "ada@northwind.io" },
      frequency: "monthly",
      now: WEDNESDAY,
    });

    const [options] = sendEmail.mock.calls[0];
    expect(options.subject).toBe("Your month on FormDrop — August 2026");

    const [props] = ReportEmail.mock.calls[0];
    expect(props.period).toBe("month");
  });
});

describe("runOnce", () => {
  it("asks only for accounts with nothing logged since the period ended", async () => {
    await runOnce("weekly", WEDNESDAY);

    // The week ends 13 September, so the 14th onwards is this period's.
    const [query] = findAccountsDueForReport.mock.calls[0];
    expect((query.since as Date).toISOString()).toBe(
      "2026-09-14T00:00:00.000Z",
    );
  });

  it("carries on when one account fails, and reports the rest", async () => {
    findAccountsDueForReport.mockResolvedValue([
      { id: "u1", email: "one@example.test" },
      { id: "u2", email: "two@example.test" },
      { id: "u3", email: "three@example.test" },
    ]);
    sendEmail
      .mockResolvedValueOnce({ messageId: "em_1" })
      .mockRejectedValueOnce(new Error("mailbox full"))
      .mockResolvedValueOnce({ messageId: "em_3" });

    // One bad address must not cost everybody else their report.
    await expect(runOnce("weekly", WEDNESDAY)).resolves.toBe(2);
    expect(sendEmail).toHaveBeenCalledTimes(3);
  });

  it("does nothing when nobody is due", async () => {
    findAccountsDueForReport.mockResolvedValue([]);

    await expect(runOnce("weekly", WEDNESDAY)).resolves.toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("omits the dashboard link rather than linking to undefined", async () => {
    delete process.env.APP_URL;

    await sendReport({
      account: { id: "u1", email: "ada@northwind.io" },
      frequency: "weekly",
      now: WEDNESDAY,
    });

    const [props] = ReportEmail.mock.calls[0];
    expect(props.dashboardUrl).toBe("");
  });
});
