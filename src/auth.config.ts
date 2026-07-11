import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. Contains NO providers, bcrypt, or Prisma so it can
 * be imported by `middleware.ts` (which runs before every request). The
 * Credentials provider and DB lookup live in `src/auth.ts`, which runs on Node.
 */
export const authConfig = {
  // Trust the deployment's host header. Auto-detected on Vercel, but required
  // for any other host (incl. `next start` and self-hosted).
  trustHost: true,
  pages: { signIn: "/login" },
  callbacks: {
    // Runs in middleware for every matched request. Everything except the login
    // page requires a session; logged-in users never see /login.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
