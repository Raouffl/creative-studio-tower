import "server-only";
import { after } from "next/server";
import { prisma } from "./prisma";
import { countVersions, parseFileKey, FigmaError } from "./figma";
import type { Task } from "./types";

/** How long a cached revisions count is trusted before we re-query Figma. */
const TTL_MS = 60 * 60 * 1000; // 1 hour
/** Max concurrent Figma requests when refreshing stale entries. Kept low —
 *  Figma rate-limits file reads aggressively (429s are retried next cycle). */
const CONCURRENCY = 2;

/**
 * Resolve the revisions count for every task, reading from the DB cache and
 * refreshing stale/missing entries from Figma **in the background** (via
 * `after`, so the render is never blocked on Figma).
 *
 * revisions = (number of "Version N" frames in the task's Figma file) − 1.
 *
 * Returns `taskId → count` only for tasks whose value is cached. Tasks with no
 * Figma link — or whose value hasn't been computed yet — are absent from the
 * map, and the board renders their revisions as "N/A".
 */
export async function getRevisionsMap(
  tasks: Task[],
): Promise<Record<string, number>> {
  const rows = await prisma.revision.findMany();
  const cache = new Map(rows.map((r) => [r.taskId, r]));

  const map: Record<string, number> = {};
  const stale: Task[] = [];
  const now = Date.now();

  for (const task of tasks) {
    if (!task.figma) continue; // no Figma link → N/A

    let key: string;
    try {
      key = parseFileKey(task.figma);
    } catch {
      continue; // unrecognizable link → N/A
    }

    const row = cache.get(task.id);
    if (row) map[task.id] = row.count; // serve the cached value immediately

    const fresh =
      row != null &&
      row.figmaKey === key &&
      now - row.updatedAt.getTime() < TTL_MS;
    if (!fresh) stale.push(task);
  }

  // Recompute stale entries after the response is sent; the next render (ISR
  // revalidates ~every 60s) picks up the freshly stored values.
  if (stale.length) after(() => refreshRevisions(stale));

  return map;
}

/** Recompute + persist revisions for the given tasks, bounded concurrency. */
async function refreshRevisions(tasks: Task[]): Promise<void> {
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const task = tasks[cursor++];
      if (!task.figma) continue;
      try {
        const key = parseFileKey(task.figma);
        const count = Math.max(0, (await countVersions(task.figma)) - 1);
        await prisma.revision.upsert({
          where: { taskId: task.id },
          create: { taskId: task.id, figmaKey: key, count },
          update: { figmaKey: key, count },
        });
      } catch (err) {
        // Keep any existing cached value and retry on the next revalidation.
        // Config/auth/link errors are expected (unset token, bad link) — stay
        // quiet; log anything unexpected.
        if (!(err instanceof FigmaError))
          console.error(`revisions: failed to refresh ${task.id}`, err);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker),
  );
}
