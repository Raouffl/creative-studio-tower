import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateUserForm } from "./create-user-form";

// Reads the session + DB, so this route renders dynamically (it is not the
// statically-cached board).
export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
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
        new logins below.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-popover text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-2.5">{u.email}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {u.name ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      u.role === "ADMIN"
                        ? "font-mono text-xs text-progress"
                        : "font-mono text-xs text-muted-foreground"
                    }
                  >
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <CreateUserForm />
      </div>
    </main>
  );
}
