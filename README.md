# Creative Studio — Control Tower

A live dashboard for the **Creative Studio → Projects** ClickUp list. It renders
every task on a three-column board (In progress / Awaiting PM feedback / Done),
pulls data straight from the ClickUp API, and tracks a manual **revisions**
counter per task (how many times a PM sent work back) that ClickUp can't store
natively.

Built with **Next.js 16** (App Router), **Tailwind CSS 4**, **shadcn/ui**, and
**Prisma + SQLite** for the revisions counter.

## Stack

| Concern             | Choice                                          |
| ------------------- | ----------------------------------------------- |
| Framework           | Next.js 16 (App Router, React 19, Turbopack)    |
| UI                  | Tailwind CSS 4 + shadcn/ui (Radix, Nova preset) |
| ClickUp data        | Server fetch, cached 60s, tag-revalidated       |
| Revisions storage   | Prisma ORM → local SQLite file                  |

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill it in:

   ```bash
   cp .env.example .env
   ```

   - `CLICKUP_TOKEN` — a ClickUp personal API token (Settings → Apps → API
     Token, starts with `pk_`).
   - `CLICKUP_LIST_ID` — defaults to the Creative Studio Projects list
     (`901517838163`).
   - `DATABASE_URL` — absolute `file:` path to `prisma/dev.db` (absolute avoids
     a Prisma/SQLite relative-path gotcha between the CLI and the runtime).

3. **Set up the database**

   ```bash
   pnpm prisma migrate dev
   ```

4. **Run the dev server**

   ```bash
   pnpm dev
   ```

   Open <http://localhost:3000>.

## How it works

- `src/lib/clickup.ts` — fetches all tasks (open + closed, paginated) from the
  list and normalizes them. Responses are cached for 60s under the
  `clickup-tasks` tag.
- The **Actualiser** button calls a server action that `revalidateTag`s that
  cache, then refreshes the route.
- `src/lib/status.ts` — buckets each task into a column by its ClickUp status and
  computes elapsed-time labels.
- Revisions live in SQLite via Prisma (`src/lib/revisions.ts`). The `+/−`
  controls optimistically update the UI and `POST /api/revisions` to persist.

## Notes on the numbers

ClickUp's current plan doesn't expose "Time in Status", so exact status-change
history isn't available. Active tasks show created→today; closed tasks show
created→closed when the creation date is present, otherwise the close date. The
revisions counter is manual — increment it whenever a PM sends a task back.

## Scripts

```bash
pnpm dev              # start dev server (Turbopack)
pnpm build            # production build
pnpm start            # serve the production build
pnpm lint             # eslint
pnpm prisma studio    # inspect the revisions table
```
