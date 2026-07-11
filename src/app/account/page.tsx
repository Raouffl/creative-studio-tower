"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { changePassword, type ChangePasswordState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: ChangePasswordState = {};

const inputClass =
  "h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-progress";

export default function AccountPage() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  return (
    <main className="mx-auto w-full max-w-sm px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to board
      </Link>

      <h1 className="mt-6 text-2xl font-bold tracking-tight">Account</h1>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        Change your password.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Current password
          <input
            name="current"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          New password
          <input
            name="next"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Confirm new password
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
        </label>

        {state.error && (
          <p className="text-xs text-warn" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-xs text-done" role="status">
            Password updated.
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-2">
          <KeyRound className="size-3.5" />
          {pending ? "Saving…" : "Update password"}
        </Button>
      </form>
    </main>
  );
}
