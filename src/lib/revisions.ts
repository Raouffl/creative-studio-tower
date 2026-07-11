import "server-only";
import { prisma } from "./prisma";

/** Map of taskId → revisions count for every task that has one. */
export async function getRevisionsMap(): Promise<Record<string, number>> {
  const rows = await prisma.revision.findMany();
  const map: Record<string, number> = {};
  for (const r of rows) map[r.taskId] = r.count;
  return map;
}

/** Upsert the revisions count for a task (clamped to >= 0). Returns the stored value. */
export async function setRevision(taskId: string, count: number): Promise<number> {
  const clamped = Math.max(0, Math.floor(count));
  await prisma.revision.upsert({
    where: { taskId },
    create: { taskId, count: clamped },
    update: { count: clamped },
  });
  return clamped;
}
