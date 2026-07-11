"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";
import { createUser, type CreateUserState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: CreateUserState = {};

const inputClass =
  "h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-progress";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUser,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <h2 className="text-sm font-semibold">Create a user</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Email
          <input
            name="email"
            type="email"
            autoComplete="off"
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Name (optional)
          <input
            name="name"
            type="text"
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Temporary password
          <input
            name="password"
            type="text"
            autoComplete="off"
            required
            minLength={8}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Role
          <select name="role" defaultValue="USER" className={inputClass}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
      </div>

      {state.error && (
        <p className="text-xs text-warn" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-xs text-done" role="status">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        <UserPlus className="size-3.5" />
        {pending ? "Creating…" : "Create user"}
      </Button>
    </form>
  );
}
