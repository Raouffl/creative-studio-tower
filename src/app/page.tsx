import { fetchTasks, ClickUpError } from "@/lib/clickup";
import { getRevisionsMap } from "@/lib/revisions";
import type { Task, TaskWithRevisions } from "@/lib/types";
import { Board } from "@/components/board";
import { SetupNotice } from "@/components/setup-notice";

export default async function Page() {
  let tasks: Task[];
  try {
    tasks = await fetchTasks();
  } catch (err) {
    if (err instanceof ClickUpError)
      return <SetupNotice kind={err.kind} detail={err.message} />;
    throw err;
  }

  const revisions = await getRevisionsMap(tasks);
  const enriched: TaskWithRevisions[] = tasks.map((t) => ({
    ...t,
    revisions: revisions[t.id] ?? null,
  }));

  return <Board tasks={enriched} now={Date.now()} />;
}
