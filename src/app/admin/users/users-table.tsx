"use client";

import { Fragment, useActionState, useState } from "react";
import { KeyRound, Pencil, Save, Trash2, X } from "lucide-react";
import {
  deleteUser,
  resetPassword,
  updateUser,
  type ActionState,
} from "./actions";
import { Button } from "@/components/ui/button";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
};

const inputClass =
  "h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-progress";

const initialState: ActionState = {};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-popover text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Email</th>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Role</th>
            <th className="px-4 py-2.5 text-right font-medium">Edit</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const open = openId === u.id;
            return (
              <Fragment key={u.id}>
                <tr className="border-t border-border">
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
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpenId(open ? null : u.id)}
                    >
                      {open ? (
                        <X className="size-3.5" />
                      ) : (
                        <Pencil className="size-3.5" />
                      )}
                      {open ? "Close" : "Edit"}
                    </Button>
                  </td>
                </tr>
                {open && (
                  <tr className="border-t border-border bg-popover/40">
                    <td colSpan={4} className="px-4 py-4">
                      <UserEditor user={u} isSelf={u.id === currentUserId} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UserEditor({ user, isSelf }: { user: UserRow; isSelf: boolean }) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateUser,
    initialState,
  );
  const [pwState, pwAction, pwPending] = useActionState(
    resetPassword,
    initialState,
  );
  const [delState, delAction, delPending] = useActionState(
    deleteUser,
    initialState,
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Profile + role */}
      <form action={profileAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={user.id} />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Email
            <input
              name="email"
              type="email"
              autoComplete="off"
              defaultValue={user.email}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Name
            <input
              name="name"
              type="text"
              autoComplete="off"
              defaultValue={user.name ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Role
            <select
              name="role"
              defaultValue={user.role}
              className={inputClass}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
        </div>
        <Message state={profileState} />
        <Button
          type="submit"
          size="sm"
          disabled={profilePending}
          className="self-start"
        >
          <Save className="size-3.5" />
          {profilePending ? "Saving…" : "Save changes"}
        </Button>
      </form>

      {/* Reset password */}
      <form
        action={pwAction}
        className="flex flex-col gap-3 border-t border-border pt-4"
      >
        <input type="hidden" name="id" value={user.id} />
        <label className="flex max-w-xs flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          New temporary password
          <input
            name="password"
            type="text"
            autoComplete="off"
            minLength={8}
            required
            className={inputClass}
          />
        </label>
        <Message state={pwState} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={pwPending}
          className="self-start"
        >
          <KeyRound className="size-3.5" />
          {pwPending ? "Resetting…" : "Reset password"}
        </Button>
      </form>

      {/* Delete */}
      <form
        action={delAction}
        onSubmit={(e) => {
          if (!confirm(`Delete ${user.email}? This can't be undone.`))
            e.preventDefault();
        }}
        className="flex flex-col gap-3 border-t border-border pt-4"
      >
        <input type="hidden" name="id" value={user.id} />
        <Message state={delState} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={delPending || isSelf}
          title={isSelf ? "You can't delete your own account" : undefined}
          className="self-start border-warn/40 text-warn hover:bg-warn/10 hover:text-warn"
        >
          <Trash2 className="size-3.5" />
          {delPending ? "Deleting…" : "Delete user"}
        </Button>
      </form>
    </div>
  );
}

function Message({ state }: { state: ActionState }) {
  if (state.error)
    return (
      <p className="text-xs text-warn" role="alert">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p className="text-xs text-done" role="status">
        {state.success}
      </p>
    );
  return null;
}
