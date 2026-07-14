import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchTasks } from "@/lib/clickup";
import { setRevision } from "@/lib/revisions";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.id !== "string" ||
    typeof body.count !== "number" ||
    !Number.isFinite(body.count)
  ) {
    return NextResponse.json(
      { error: "Expected JSON body { id: string, count: number }" },
      { status: 400 },
    );
  }

  // Admins may edit any task; everyone else only tasks they're assigned to.
  // Re-check here — the UI disables the buttons, but the route can be called
  // directly, so mutations must never trust the client.
  if (session.user.role !== "ADMIN") {
    const email = session.user.email?.trim().toLowerCase();
    const task = (await fetchTasks()).find((t) => t.id === body.id);
    if (!task) {
      return NextResponse.json({ error: "Unknown task" }, { status: 404 });
    }
    if (!email || !task.assigneeEmails.includes(email)) {
      return NextResponse.json(
        { error: "Only assignees can edit revisions for this task" },
        { status: 403 },
      );
    }
  }

  const count = await setRevision(body.id, body.count);
  return NextResponse.json({ id: body.id, count });
}
