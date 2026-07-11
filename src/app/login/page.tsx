"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { authenticate, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialState,
  );

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          Creative <span className="text-progress">Studio</span>
        </h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Sign in to the control tower.
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-progress"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-progress"
            />
          </label>

          {state.error && (
            <p className="text-xs text-warn" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-2">
            <LogIn className="size-3.5" />
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
