"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client-side session context so components can read the current user's role
 * without forcing server components (like the board page) to become dynamic.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
