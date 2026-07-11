"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";

/** Invalidate cached ClickUp data for the board so the next render refetches. */
export async function refreshBoard() {
  revalidatePath("/", "page");
}

/** Sign the current user out and send them to the login page. */
export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
