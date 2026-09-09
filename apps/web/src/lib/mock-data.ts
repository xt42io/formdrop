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
    recentUsage: [],
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

// Seven days ending today, shaped so each form's sparkline differs.
function recentUsage(total: number, seed: number) {
  const base = Math.max(0, total / 90);
  return Array.from({ length: 7 }, (_, i) => ({
    date: daysAgo(6 - i).slice(0, 10),
    count: Math.round(base * (1 + Math.sin((i + seed) / 1.6) * 0.7)),
  }));
}

for (const [i, form] of FORMS.entries()) {
  form.recentUsage = recentUsage(form.submissionCount ?? 0, i * 2);
}

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
/*
 * A signed-in admin, so the admin surface can be opened without a database.
 *
 * (admin)/admin.tsx redirects anyone whose session role is not "admin", and
 * with no database there is no session at all -- so the screens were
 * unreachable even to look at. This is the same temporary scaffolding as the
 * rest of this file and disappears with it.
 */
const MOCK_USER = {
  id: "mock-user",
  name: "Ada Lovelace",
  email: "ada@formdrop.co",
  emailVerified: true,
  image: null,
  role: "admin",
  banned: false,
  banReason: null,
  banExpires: null,
  createdAt: daysAgo(400),
  updatedAt: daysAgo(2),
};

const MOCK_SESSION = {
  session: {
    id: "mock-session",
    token: "mock",
    userId: MOCK_USER.id,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    ipAddress: "127.0.0.1",
    userAgent: "mock",
  },
  user: MOCK_USER,
};

const ADMIN_USERS = [
  { ...MOCK_USER, formCount: 4, submissionCount: 1811 },
  {
    ...MOCK_USER,
    id: "u2",
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "user",
    formCount: 2,
    submissionCount: 318,
  },
  {
    ...MOCK_USER,
    id: "u3",
    name: "Alan Turing",
    email: "alan@example.com",
    role: "user",
    banned: true,
    banReason: "Spam",
    formCount: 1,
    submissionCount: 12,
  },
];

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
  [
    /^\/api\/admin\/stats$/,
    // Shaped like the handler: totals and charts, not a flat object. The
    // chart rows use { date, count } and { formName, count }, which is what
    // packages/core/data/admin.ts selects.
    () => ({
      totals: {
        users: ADMIN_USERS.length,
        forms: FORMS.length,
        submissions: FORMS.reduce((n, f) => n + f.submissionCount, 0),
      },
      charts: {
        usersOverTime: series(30, 2).map((d) => ({
          date: d.date,
          count: d.submissions,
        })),
        submissionsOverTime: series(30, 40).map((d) => ({
          date: d.date,
          count: d.submissions,
        })),
        topForms: FORMS.slice(0, 5).map((f) => ({
          formId: f.id,
          formName: f.name,
          count: f.submissionCount,
        })),
      },
    }),
  ],
  [
    /^\/api\/admin\/forms$/,
    () => ({
      forms: FORMS.map((f) => ({
        ...f,
        userName: MOCK_USER.name,
        userEmail: MOCK_USER.email,
      })),
    }),
  ],
  [
    /^\/api\/admin\/submissions$/,
    () => ({
      submissions: submissionsFor(FORMS[0].id, 40).map((row) => ({
        ...row,
        formName: FORMS[0].name,
      })),
    }),
  ],
  [
    /^\/api\/admin\/users\/([^/]+)$/,
    (m) => {
      const user = ADMIN_USERS.find((u) => u.id === m[1]) ?? ADMIN_USERS[0];
      return {
        user: {
          ...user,
          forms: FORMS.slice(0, 2).map((f) => ({
            id: f.id,
            name: f.name,
            createdAt: f.createdAt,
            submissionCount: f.submissionCount,
          })),
          recentSubmissions: submissionsFor(FORMS[0].id, 5).map((row) => ({
            id: row.id,
            formId: FORMS[0].id,
            formName: FORMS[0].name,
            createdAt: row.createdAt,
          })),
        },
      };
    },
  ],
  [/^\/api\/admin\/users$/, () => ({ users: ADMIN_USERS })],
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
 * This patches `fetch` rather than the axios adapter it replaced. Everything
 * that talks to the API -- appClient, adminClient -- now goes through fetch,
 * so there is one place to intercept.
 *
 * Anything that is not a dashboard API path falls through to the real fetch,
 * so auth, assets and the Vite dev channels are untouched.
 */
export function installMockData(): void {
  if (!MOCK_ENABLED) return;
  if (typeof window === "undefined") return;

  const real = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const path = new URL(raw, window.location.origin).pathname;

    // The admin plugin's user list. Not served through the ROUTES table
    // below because that only covers /api/*, and this lives under /api/auth
    // where the real handler would answer 401 with no database behind it.
    if (path === "/api/auth/admin/list-users") {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return new Response(
        JSON.stringify({ users: ADMIN_USERS, total: ADMIN_USERS.length }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Better Auth's session lookup is the other auth route that gets answered:
    // without it useSession() is empty, and the admin layout redirects to /
    // before any of these fixtures are ever reached. Every other /api/auth
    // path -- sign-in, callbacks -- still goes to the real handler.
    if (path === "/api/auth/get-session") {
      await new Promise((resolve) => setTimeout(resolve, 60));
      return new Response(JSON.stringify(MOCK_SESSION), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!path.startsWith("/api/") || path.startsWith("/api/auth")) {
      return real(input, init);
    }

    // A little latency, so loading and skeleton states are visible rather than
    // being skipped over entirely.
    await new Promise((resolve) => setTimeout(resolve, 120));

    return new Response(JSON.stringify(respond({ url: path })), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  console.warn(
    "[FormDrop] VITE_MOCK_DATA=1 - dashboard requests are served from " +
      "fixtures, not the database.",
  );
}

/*
 * Installed on import, not by a call the importer has to remember to make.
 *
 * ES module bodies run in import order, and a call placed after
 * `import { routeTree }` runs after every route module -- including the one
 * that constructs the Better Auth client, which fetches the session as it
 * initialises. The patch has to exist before that, so it goes here and
 * router.tsx imports this module first.
 */
installMockData();
