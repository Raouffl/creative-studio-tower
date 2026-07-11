"use server";

import { revalidatePath } from "next/cache";

/** Invalidate cached ClickUp data for the board so the next render refetches. */
export async function refreshBoard() {
  revalidatePath("/", "page");
}
