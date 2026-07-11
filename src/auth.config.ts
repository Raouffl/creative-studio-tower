import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. Contains NO providers, bcrypt, or Prisma so it can
 * be imported by `proxy.ts` (which runs before every request). The Credentials
 * provider and DB lookup live in `src/auth.ts`, which runs on Node. The
 * JWT/session callbacks are edge-safe (pure field shuffling), so they live here
 * too — that lets `proxy.ts` see `user.role` for the /admin gate.
 */
export const authConfig = {
  // Trust the deployment's host header. Auto-detected on Vercel, but required
  // for any other host (incl. `next start` and self-hosted).
  trustHost: true,
  pages: { signIn: "/login" },
  // Credentials-based sign-in requires the JWT session strategy (there is no
  // database session table).
  session: { strategy: "jwt" },
  callbacks: {
    // Runs in `proxy.ts` for every matched request.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      if (!isLoggedIn) return false;

      // Admin-only area — bounce non-admins back to the board.
      if (
        nextUrl.pathname.startsWith("/admin") &&
        auth?.user?.role !== "ADMIN"
      ) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.role) session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
