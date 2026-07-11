"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type CreateUserState = { error?: string; success?: string };

export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  // Never trust the proxy alone for a mutation — re-check the role here.
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Forbidden." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "USER";

  if (!email || !password)
    return { error: "Email and password are required." };
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "A user with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, name: name || null, passwordHash, role },
  });

  revalidatePath("/admin/users");
  return { success: `Created ${email} (${role}).` };
}
