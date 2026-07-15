import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Enforces the `authorized` callback on every matched request. Uses the
// edge-safe config (no providers/Prisma/bcrypt). `proxy` is the Next 16
// successor to the old `middleware` convention.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Protect the board (and any future app routes). Exclude Auth.js's own
  // routes, Next internals, and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
