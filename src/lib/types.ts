export type Bucket = "progress" | "wait" | "done";

/** Normalized task shape used across the app. */
export interface Task {
  id: string;
  name: string;
  /** ClickUp status name, e.g. "waiting for pm feedback". */
  status: string;
  /** ClickUp status type: "open" | "custom" | "done" | "closed". */
  statusType: string;
  /** Hex color ClickUp assigns to the status. */
  statusColor: string;
  /** Display names of assignees. */
  assignees: string[];
  /** Epoch ms of creation, or null when unavailable. */
  created: number | null;
  /** Epoch ms of close/done, or null when still active. */
  closed: number | null;
  /** Deep link back into ClickUp. */
  url: string;
}

/** Task enriched with its manual revisions count. */
export interface TaskWithRevisions extends Task {
  revisions: number;
}
