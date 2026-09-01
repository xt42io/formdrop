# FormDrop

The backend for headless forms. Point a form at one URL, get submissions in a
dashboard plus notifications by email, Slack and Discord, and sync to Google
Sheets and Airtable.

## Layout

This is an npm-workspaces monorepo, orchestrated with Turborepo.

```
apps/
  web/          TanStack Start — landing page, dashboard, admin, app API routes
  api/          Public API on api.formdrop.co (Express today; Elysia in P2)
packages/
  db/           Drizzle schema, migrations and client — the single source of truth
  ui/           Design tokens and primitive utilities
  tsconfig/     Shared TypeScript config
docs/
  PRD.md        The v2 plan: redesign, monorepo, Elysia, Fumadocs, PostHog, SendByte, SDKs
```

`packages/db` is the only place the schema is defined. Both apps import it as
`@formdrop/db`, so a column added there is immediately visible to each.

## Getting started

```bash
npm install
cp .env.example .env    # then fill in DATABASE_URL at minimum
npm run dev
```

`npm run dev` starts every app. To run one:

```bash
npm run dev:web         # http://localhost:1200
npm run dev:api         # http://localhost:1400
```

A single `.env` at the repo root serves the whole workspace — the web app reads
it through Vite's `envDir`, and `@formdrop/db` looks for it relative to the
package as well as the caller's working directory.

## Common tasks

| Command | What it does |
|---|---|
| `npm run dev` | Every app in watch mode |
| `npm run build` | Build all apps (Turbo caches per package) |
| `npm run typecheck` | `tsc --noEmit` across the workspace |
| `npm run test` | Vitest |
| `npm run format` | Prettier over the repo |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed users, forms and submissions |
| `npm run db:clear` | Wipe local data (also clears Polar customers) |

Turbo runs each task in its own package, so `npm run typecheck` on a branch that
only touched `apps/web` skips the packages it didn't affect.

## Stack

- **Web** — TanStack Start (Router + Query + Table), React 19, Tailwind 4, Vite 7, Nitro
- **Auth** — Better Auth
- **Database** — Postgres via Drizzle
- **Billing** — Polar
- **Icons** — Hugeicons
