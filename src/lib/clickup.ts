import "server-only";
import type { Task } from "./types";

const BASE = "https://api.clickup.com/api/v2";
export const CLICKUP_TASKS_TAG = "clickup-tasks";

/** Thrown when the ClickUp integration is misconfigured or the API rejects us. */
export class ClickUpError extends Error {
  constructor(
    message: string,
    readonly kind: "config" | "auth" | "http",
    readonly status?: number,
  ) {
    super(message);
    this.name = "ClickUpError";
  }
}

interface RawClickUpTask {
  id: string;
  name: string;
  url: string;
  status?: { status?: string; type?: string; color?: string };
  assignees?: { username?: string; email?: string }[];
  date_created?: string | null;
  date_closed?: string | null;
  date_done?: string | null;
}

interface RawTaskPage {
  tasks: RawClickUpTask[];
  last_page?: boolean;
}

function mapTask(t: RawClickUpTask): Task {
  const closed = t.date_closed ?? t.date_done ?? null;
  return {
    id: t.id,
    name: t.name,
    status: t.status?.status ?? "unknown",
    statusType: t.status?.type ?? "custom",
    statusColor: t.status?.color ?? "#8c96b3",
    assignees: (t.assignees ?? [])
      .map((a) => a.username || a.email || "")
      .filter(Boolean),
    created: t.date_created ? Number(t.date_created) : null,
    closed: closed ? Number(closed) : null,
    url: t.url,
  };
}

/**
 * Fetch every task (open + closed) from the configured ClickUp list.
 * Cached for 60s and tagged so a refresh can revalidate on demand.
 */
export async function fetchTasks(): Promise<Task[]> {
  const token = process.env.CLICKUP_TOKEN;
  const listId = process.env.CLICKUP_LIST_ID;

  if (!token)
    throw new ClickUpError("CLICKUP_TOKEN is not set.", "config");
  if (!listId)
    throw new ClickUpError("CLICKUP_LIST_ID is not set.", "config");

  const all: Task[] = [];
  for (let page = 0; page < 50; page++) {
    const url = new URL(`${BASE}/list/${listId}/task`);
    url.searchParams.set("archived", "false");
    url.searchParams.set("include_closed", "true");
    url.searchParams.set("subtasks", "true");
    url.searchParams.set("order_by", "created");
    url.searchParams.set("page", String(page));

    const res = await fetch(url, {
      headers: { Authorization: token, "Content-Type": "application/json" },
      next: { revalidate: 60, tags: [CLICKUP_TASKS_TAG] },
    });

    if (res.status === 401)
      throw new ClickUpError("ClickUp rejected the API token.", "auth", 401);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ClickUpError(
        `ClickUp API error ${res.status}: ${body.slice(0, 200)}`,
        "http",
        res.status,
      );
    }

    const data = (await res.json()) as RawTaskPage;
    const tasks = data.tasks ?? [];
    all.push(...tasks.map(mapTask));

    if (data.last_page || tasks.length === 0) break;
  }

  return all;
}
