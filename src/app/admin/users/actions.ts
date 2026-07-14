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

export type ActionState = { error?: string; success?: string };

/** Update a user's email, name, and role. */
export async function updateUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Forbidden." };

  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "USER";

  if (!id) return { error: "Missing user id." };
  if (!email.includes("@")) return { error: "Enter a valid email address." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };

  const clash = await prisma.user.findUnique({ where: { email } });
  if (clash && clash.id !== id)
    return { error: "A user with that email already exists." };

  // Never let the last admin lose their admin role and lock everyone out.
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return { error: "Can't demote the last remaining admin." };
  }

  await prisma.user.update({
    where: { id },
    data: { email, name: name || null, role },
  });

  revalidatePath("/admin/users");
  return { success: `Updated ${email}.` };
}

/** Set a new bcrypt-hashed password for a user. */
export async function resetPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Forbidden." };

  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!id) return { error: "Missing user id." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  revalidatePath("/admin/users");
  return { success: `Password reset for ${target.email}.` };
}

/** Permanently delete a login account. */
export async function deleteUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Forbidden." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing user id." };
  if (id === session.user.id)
    return { error: "You can't delete your own account." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };

  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return { error: "Can't delete the last remaining admin." };
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/admin/users");
  return { success: `Deleted ${target.email}.` };
}
