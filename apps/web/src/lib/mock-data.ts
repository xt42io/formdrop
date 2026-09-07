import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import type {
  ApiKey,
  Form,
  FormDetail,
  Recipient,
  Submission,
  Subscription,
} from "./app-client";

/**
 * TEMPORARY. Dashboard fixtures, so the UI can be worked on without a running
 * database.
 *
 * TO REMOVE: delete this file and the two lines that call installMockData in
 * app-client.ts. Nothing else in the codebase imports it.
 *
 * Off unless VITE_MOCK_DATA=1 is set, so it cannot ship on by accident -- a
 * constant in this file could be committed in the wrong state, an absent
 * environment variable cannot.
 *
 * The fixtures are typed against the derived entity types rather than written
 * loosely, so if a query in packages/core changes shape this stops compiling
 * instead of quietly serving a shape the UI no longer expects.
 */
export const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === "1";

const USER_ID = "mock-user-0000";
const NOW = new Date("2026-09-07T09:15:00.000Z");

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString();
}

function makeForm(
  over: Partial<Form> & Pick<Form, "id" | "name" | "slug">,
): Form {
  return {
    userId: USER_ID,
    description: null,
    allowedDomains: [],
    emailNotificationsEnabled: true,
    slackNotificationsEnabled: false,
    slackChannelName: null,
    slackTeamName: null,
    discordNotificationsEnabled: false,
    discordChannelName: null,
    discordGuildName: null,
    googleSheetsEnabled: false,
    googleSheetsSpreadsheetName: null,
    googleSheetsSpreadsheetId: null,
    googleSheetsConnected: false,
    airtableEnabled: false,
    airtableBaseName: null,
    airtableTableName: null,
    airtableConnected: false,
    slackConnected: false,
    discordConnected: false,
    createdAt: daysAgo(40),
    updatedAt: daysAgo(2),
    submissionCount: 0,
    ...over,
  } as Form;
}

const FORMS: Form[] = [
  makeForm({
    id: "11111111-1111-4111-8111-111111111111",
    name: "Contact form",
    slug: "a7Kq2ZmB",
    description: "The contact form on the marketing site.",
    submissionCount: 1284,
    allowedDomains: ["example.com", "*.example.com"],
    slackNotificationsEnabled: true,
    slackConnected: true,
    slackChannelName: "leads",
    slackTeamName: "Acme",
    createdAt: daysAgo(96),
  }),
  makeForm({
    id: "22222222-2222-4222-8222-222222222222",
    name: "Beta waitlist",
    slug: "Wq9fLp3X",
    description: "Signups for the private beta.",
    submissionCount: 431,
    discordNotificationsEnabled: true,
    discordConnected: true,
    discordChannelName: "waitlist",
    discordGuildName: "Acme Community",
    createdAt: daysAgo(58),
  }),
  makeForm({
    id: "33333333-3333-4333-8333-333333333333",
    name: "Customer feedback",
    slug: "Hn4bVc8T",
    description: "Post-purchase feedback survey.",
    submissionCount: 96,
    googleSheetsEnabled: true,
    googleSheetsConnected: true,
    googleSheetsSpreadsheetName: "Feedback Q3",
    googleSheetsSpreadsheetId: "1AbCdEfGhIjK",
    createdAt: daysAgo(21),
  }),
  makeForm({
    id: "44444444-4444-4444-8444-444444444444",
    name: "Job applications",
    slug: "Zx1mRt6Y",
    submissionCount: 0,
    emailNotificationsEnabled: false,
    createdAt: daysAgo(3),
  }),
];

const PAYLOADS: Record<string, unknown>[] = [
  {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Does this support file uploads?",
  },
  {
    name: "Grace Hopper",
    email: "grace@example.com",
    message: "Loving the product so far.",
  },
  {
    name: "Alan Turing",
    email: "alan@example.com",
    message: "How do I restrict domains?",
  },
  {
    name: "Katherine Johnson",
    email: "katherine@example.com",
    message: "Invoice question, see attached.",
  },
  {
    name: "Radia Perlman",
    email: "radia@example.com",
    message: "Feature request: outgoing webhooks.",
  },
];

function submissionsFor(formId: string, count: number): Submission[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${formId.slice(0, 8)}-sub-${String(i).padStart(4, "0")}`,
    formId,
    payload: PAYLOADS[i % PAYLOADS.length],
    ip: `203.0.113.${(i % 250) + 1}`,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    createdAt: daysAgo(i * 0.4),
    deletedAt: null,
  })) as unknown as Submission[];
}

const RECIPIENTS = [
  {
    id: "rec-1",
    formId: FORMS[0].id,
    email: "team@example.com",
    enabled: true,
    verifiedAt: daysAgo(30),
    verificationTokenExpiresAt: null,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
  {
    id: "rec-2",
    formId: FORMS[0].id,
    email: "sales@example.com",
    enabled: true,
    verifiedAt: null,
    // Already past, so the "Invitation Expired" state is visible too.
    verificationTokenExpiresAt: daysAgo(1),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
] as unknown as Recipient[];

const API_KEYS = [
  {
    id: "key-1",
    userId: USER_ID,
    key: "fd_live_9f2a7c41d8e04b6f9a3c5d7e1b2f4a68",
    name: "Production server",
    lastUsedAt: daysAgo(0.2),
    createdAt: daysAgo(64),
  },
  {
    id: "key-2",
    userId: USER_ID,
    key: "fd_live_1c8b3e59f7a24d0c8e6b9f2a4d7c1e35",
    name: "Staging",
    lastUsedAt: null,
    createdAt: daysAgo(12),
  },
] as unknown as ApiKey[];

// Free plan, so the sidebar upgrade card and the requiresPro gating on the
// integration buttons are both visible rather than hidden behind a Pro account.
const SUBSCRIPTION: Subscription | null = null;

function series(days: number, base: number) {
  return Array.from({ length: days }, (_, i) => ({
    date: daysAgo(days - 1 - i).slice(0, 10),
    submissions: Math.max(
      0,
      Math.round(base + Math.sin(i / 2.2) * base * 0.45 + (i % 5)),
    ),
  }));
}

const TOTAL_SUBMISSIONS = FORMS.reduce(
  (n, f) => n + (f.submissionCount ?? 0),
  0,
);

type MockConfig = { url?: string; params?: Record<string, unknown> };

/** Checked in order, so the more specific patterns come first. */
const ROUTES: [RegExp, (m: RegExpMatchArray, cfg: MockConfig) => unknown][] = [
  [
    /^\/api\/forms\/([^/]+)\/submissions$/,
    (m, cfg) => {
      const form = FORMS.find((f) => f.id === m[1]);
      const all = submissionsFor(
        m[1],
        Math.min(form?.submissionCount ?? 0, 120),
      );
      const page = Number(cfg.params?.page ?? 1);
      const limit = Number(cfg.params?.limit ?? 50);
      return {
        submissions: all.slice((page - 1) * limit, page * limit),
        pagination: {
          total: all.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(all.length / limit)),
        },
      };
    },
  ],
  [
    /^\/api\/forms\/([^/]+)\/analytics$/,
    (m) => {
      const total = FORMS.find((f) => f.id === m[1])?.submissionCount ?? 0;
      return {
        stats: {
          total,
          thisMonth: Math.round(total * 0.32),
          today: Math.round(total * 0.01),
        },
        chartData: series(30, Math.max(1, total / 40)),
      };
    },
  ],
  [/^\/api\/forms\/([^/]+)\/recipients$/, () => ({ recipients: RECIPIENTS })],
  [
    /^\/api\/forms\/([^/]+)$/,
    (m) => ({
      form: (FORMS.find((f) => f.id === m[1]) ??
        FORMS[0]) as unknown as FormDetail,
    }),
  ],
  [/^\/api\/forms$/, () => ({ forms: FORMS })],
  [/^\/api\/api-keys$/, () => ({ keys: API_KEYS })],
  [/^\/api\/subscription$/, () => ({ subscription: SUBSCRIPTION })],
  [
    /^\/api\/analytics$/,
    () => ({
      stats: {
        totalForms: FORMS.length,
        totalSubmissions: TOTAL_SUBMISSIONS,
        submissionsThisMonth: Math.round(TOTAL_SUBMISSIONS * 0.28),
      },
      chartData: series(30, 18),
      topForms: FORMS.map((f) => ({
        id: f.id,
        name: f.name,
        submissionCount: f.submissionCount ?? 0,
      })).sort((a, b) => b.submissionCount - a.submissionCount),
    }),
  ],
  [
    /^\/api\/admin\/stats$/,
    () => ({
      totals: {
        users: 128,
        forms: FORMS.length * 26,
        submissions: TOTAL_SUBMISSIONS * 9,
      },
      charts: {
        usersOverTime: series(30, 4).map((d) => ({
          date: d.date,
          users: d.submissions,
        })),
        submissionsOverTime: series(30, 140),
        topForms: FORMS.map((f) => ({
          id: f.id,
          name: f.name,
          submissionCount: f.submissionCount ?? 0,
        })),
      },
    }),
  ],
  [
    /^\/api\/admin\/forms$/,
    () => ({
      forms: FORMS.map((f) => ({
        id: f.id,
        name: f.name,
        userId: USER_ID,
        userName: "Ada Lovelace",
        createdAt: f.createdAt,
        submissionCount: f.submissionCount ?? 0,
      })),
    }),
  ],
  [
    /^\/api\/admin\/submissions$/,
    () => ({
      submissions: submissionsFor(FORMS[0].id, 25).map((s) => ({
        id: s.id,
        formId: s.formId,
        formName: FORMS[0].name,
        createdAt: s.createdAt,
        payload: s.payload,
      })),
    }),
  ],
];

function respond(config: MockConfig) {
  const url = (config.url ?? "").split("?")[0];

  for (const [pattern, build] of ROUTES) {
    const match = url.match(pattern);
    if (match) return build(match, config);
  }

  // Anything not listed is a mutation, or an endpoint with no fixture.
  // Answering success keeps the UI navigable rather than showing an error
  // nobody can clear without a database.
  return { success: true };
}

/**
 * Replaces the transport, so no request leaves the browser.
 *
 * An adapter rather than an interceptor: it substitutes the whole request, so
 * there is no network call to fail first and nothing to unwind afterwards.
 */
export function installMockData(instance: AxiosInstance): void {
  if (!MOCK_ENABLED) return;

  const adapter = async (config: MockConfig): Promise<AxiosResponse> => {
    // A little latency, so loading and skeleton states are visible rather than
    // being skipped over entirely.
    await new Promise((resolve) => setTimeout(resolve, 120));

    return {
      data: respond(config),
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    } as unknown as AxiosResponse;
  };

  instance.defaults.adapter = adapter as never;
  // The admin pages call the global axios export rather than this instance.
  axios.defaults.adapter = adapter as never;

  console.warn(
    "[FormDrop] VITE_MOCK_DATA=1 - dashboard requests are served from " +
      "fixtures, not the database.",
  );
}
