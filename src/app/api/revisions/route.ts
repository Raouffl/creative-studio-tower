import { NextResponse } from "next/server";
import { setRevision } from "@/lib/revisions";

export async function POST(req: Request) {
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

  const count = await setRevision(body.id, body.count);
  return NextResponse.json({ id: body.id, count });
}
