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
  /** Lowercased emails of assignees (for matching the logged-in user). */
  assigneeEmails: string[];
  /** Epoch ms of creation, or null when unavailable. */
  created: number | null;
  /** Epoch ms of close/done, or null when still active. */
  closed: number | null;
  /** Deep link back into ClickUp. */
  url: string;
  /** Figma link from the ClickUp "Figma" custom field, or null when unset. */
  figma: string | null;
  /** Assets link from the ClickUp "Drive Folder" custom field, or null when unset. */
  drive: string | null;
}

/** Task enriched with its Figma-derived revisions count. */
export interface TaskWithRevisions extends Task {
  /** Revisions (= Figma "Version N" frames − 1), or null when there's no
   *  Figma link or the count hasn't been computed yet ("N/A" in the UI). */
  revisions: number | null;
}
