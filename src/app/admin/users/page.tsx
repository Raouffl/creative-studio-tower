import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateUserForm } from "./create-user-form";
import { UsersTable } from "./users-table";

// Reads the session + DB, so this route renders dynamically (it is not the
// statically-cached board).
export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to board
      </Link>

      <h1 className="mt-6 text-2xl font-bold tracking-tight">Users</h1>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {users.length} account{users.length === 1 ? "" : "s"}. Admins can create
        new logins and edit existing ones below.
      </p>

      <div className="mt-8">
        <UsersTable users={users} currentUserId={session.user.id} />
      </div>

      <div className="mt-8">
        <CreateUserForm />
      </div>
    </main>
  );
}
