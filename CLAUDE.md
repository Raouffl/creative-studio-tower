# CLAUDE.md

Guidance for working in this repo. Read this before making changes.

## What this is

A Next.js dashboard ("control tower") for the **Creative Studio → Projects**
ClickUp list. It renders every task on a three-column board and tracks a manual
per-task **revisions** counter (how many times a PM sent work back) that ClickUp
can't store natively.

## Commands

```bash
pnpm dev                     # dev server (Turbopack)
pnpm build                   # prisma migrate deploy + production build (full type-check)
pnpm start                   # serve the production build
pnpm lint                    # eslint

pnpm prisma migrate dev      # create + apply a migration (interactive)
pnpm prisma migrate deploy   # apply pending migrations (non-interactive / fresh clone)
pnpm prisma generate         # regenerate the client (also runs on postinstall)
pnpm prisma studio           # inspect the Revision / User tables

pnpm user:create <email> <password> [name]   # create/update a login account

docker compose -f docker-compose.dev.yaml up -d     # start local Postgres
docker compose -f docker-compose.dev.yaml down      # stop (keeps data)
docker compose -f docker-compose.dev.yaml down -v   # stop + wipe data
```

Environment (`.env`, gitignored — copy from `.env.example`):
`CLICKUP_TOKEN`, `CLICKUP_LIST_ID` (default `901517838163`), `DATABASE_URL`
(Postgres; the default matches `docker-compose.dev.yaml`), `AUTH_SECRET`
(sign session JWTs — generate with `npx auth secret`). **Start Postgres
before running the app or Prisma migrations.**

## Architecture / data flow

- `src/app/page.tsx` — **server component**. Fetches ClickUp tasks + revisions
  from the DB, merges them, and passes them to the client board. Renders
  `SetupNotice` instead of crashing when ClickUp is misconfigured.
- `src/lib/clickup.ts` — paginated ClickUp fetch (open + closed), normalizes raw
  tasks to the `Task` type, throws typed `ClickUpError`. `fetch` is cached 60s
  under the `clickup-tasks` tag.
- `src/lib/status.ts` — pure helpers: `bucketOf` (status → column), elapsed-time
  labels, initials, date formatting. **Column titles live here.**
- `src/lib/revisions.ts` + `src/app/api/revisions/route.ts` — read/upsert the
  revisions counter via Prisma. The board optimistically updates and
  `POST /api/revisions` persists.
- `src/app/actions.ts` — `refreshBoard` + `signOutAction` server actions.
- `src/components/board.tsx` — **client component**, all interactivity: filter,
  sort, optimistic revisions `+/−`, refresh + sign-out buttons. UI text lives here.
- **Auth (Auth.js v5 / Credentials).** `src/auth.config.ts` is the edge-safe
  config (no providers/Prisma/bcrypt) imported by `src/proxy.ts` — its
  `authorized` callback gates every request. `src/auth.ts` adds the Credentials
  provider (bcrypt-compares against the `User` table) and JWT/session callbacks.
  `src/app/api/auth/[...nextauth]/route.ts` re-exports the handlers; `src/app/login`
  is the sign-in form + server action. `scripts/create-user.ts` seeds accounts
  (no signup UI). Session strategy is **JWT** (Credentials requires it).

## Conventions & gotchas

- **Prisma 7 requires a driver adapter.** The client is constructed with
  `PrismaPg` (from `@prisma/adapter-pg`) in `src/lib/prisma.ts`; you can't
  `new PrismaClient()` bare. The generated client lives at `src/generated/prisma`
  (gitignored, regenerated via the `postinstall` script) — import from
  `@/generated/prisma/client`.
- **DB is Postgres, run via `docker-compose.dev.yaml`.** It must be up before
  `pnpm dev`, `pnpm build` (the page prerenders and reads the DB), or any
  `prisma migrate` command.
- **After changing the datasource provider or schema, regenerate + clear cache.**
  If you edit `schema.prisma`, run `pnpm prisma generate` and `rm -rf .next` —
  a stale generated client / Turbopack chunk will otherwise error with a
  provider-mismatch (e.g. "adapter-pg is not compatible with provider sqlite").
- **Next 16:** `revalidateTag` now takes a required second arg (cache profile).
  We use `revalidatePath` instead — keep that in mind before reaching for tags.
- **Auth request-gating lives in `src/proxy.ts`** (Next 16 renamed the
  `middleware` convention to `proxy` — the old filename builds with a warning,
  and Next only recognizes a **default** function export, not a destructured
  `export const { auth: middleware }`). It's compiled at server **startup**, so
  restart `pnpm dev` after touching it — HMR won't reload it. Its `matcher`
  protects the board *and* `/api/revisions` while excluding `/api/auth`.
- **`trustHost: true` is set in `auth.config.ts`** — without it Auth.js throws
  `UntrustedHost` on any non-Vercel host (incl. `pnpm start` locally).
- **`AUTH_SECRET` must be set** or Auth.js fails to sign sessions. Keep it stable
  across restarts, or every existing session cookie is invalidated.
- **`scripts/create-user.ts` runs via `tsx`** (`pnpm user:create`), not Node
  directly: the generated Prisma client uses extensionless ESM imports that
  Node's native resolver can't follow. `esbuild` (pulled in by `tsx`) is
  allow-listed in `pnpm-workspace.yaml`.
- **The page statically prerenders with 1-minute ISR** + on-demand refresh (the
  "server fetch + revalidate" choice). Data (and the `now` timestamp) refreshes
  every ~60s or when the refresh button revalidates the path.
- **ClickUp status names are the source of truth** and come back in English
  (`in progress`, `waiting for pm feedback`, `on hold`, `projects done`,
  `ahmed validation`). Bucketing + badge mapping key off these exact lowercased
  names in `status.ts` / `board.tsx` — don't rename the keys.
- **Domain term is "revisions"** (formerly "retours"). DB model `Revision`,
  route `/api/revisions`, type `TaskWithRevisions`. Note the identifier is
  `revisions` not `return`/`returns` (the latter is a JS reserved word).
- **UI is English, dark-mode only.** Theme tokens (incl. status colors
  `--progress`/`--wait`/`--done`/`--hold`/`--warn`) are in `src/app/globals.css`;
  `dark` is hard-coded on `<html>` in `layout.tsx`.
- **shadcn/ui** (Radix primitives, Nova preset). Add components with
  `pnpm dlx shadcn@latest add <name>`; they land in `src/components/ui`.
- Runtime is **Node 25 + pnpm**. Build-script deps (`sharp`, `unrs-resolver`,
  `prisma`) are allow-listed in `pnpm-workspace.yaml`. `pg` is pure JS (no native
  build).

## Verifying changes

`pnpm build` type-checks the whole project (Postgres must be running, since `/`
prerenders and reads the DB). For a runtime smoke test, the board should render
~71 cards from the live list, and `POST /api/revisions {id,count}` should return
`{id,count}` and persist to the `Revision` table (inspect with
`pnpm prisma studio`).
