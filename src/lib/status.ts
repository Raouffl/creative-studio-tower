import type { Bucket, Task } from "./types";

/** ClickUp status names that mean "waiting for PM feedback". */
export const WAIT_STATUSES = new Set(["waiting for pm feedback"]);

/** Column metadata, keyed by bucket. */
export const COLUMNS: { key: Bucket; title: string }[] = [
  { key: "progress", title: "In progress" },
  { key: "wait", title: "Awaiting PM feedback" },
  { key: "done", title: "Done" },
];

/** Map a task's ClickUp status to one of the three board columns. */
export function bucketOf(task: Pick<Task, "status" | "statusType">): Bucket {
  const type = task.statusType?.toLowerCase();
  if (type === "done" || type === "closed") return "done";
  if (task.status?.toLowerCase() === "projects done") return "done";
  if (WAIT_STATUSES.has(task.status?.toLowerCase())) return "wait";
  return "progress"; // in progress, on hold, ahmed validation, etc.
}

/** Whole days between two epoch-ms timestamps (never negative). */
export function daysBetween(a: number, b: number): number {
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** Two-letter initials from a display name. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Localized short date, or an em dash for missing values. */
export function fmtDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Human-readable elapsed-time label for a task.
 * ClickUp's current plan lacks "Time in Status", so we approximate:
 * active tasks show created→now, closed tasks show total or close date.
 */
export function elapsedInfo(
  task: Pick<Task, "created" | "closed">,
  now: number,
): { label: string; approximate: boolean } {
  if (task.closed) {
    if (task.created)
      return {
        label: `${daysBetween(task.created, task.closed)}d (created→closed)`,
        approximate: false,
      };
    return { label: `closed ${fmtDate(task.closed)}`, approximate: true };
  }
  if (task.created)
    return { label: `${daysBetween(task.created, now)}d open`, approximate: false };
  return { label: "creation date unknown", approximate: true };
}
