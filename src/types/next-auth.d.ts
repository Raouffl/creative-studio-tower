import type { DefaultSession } from "next-auth";

type Role = "ADMIN" | "USER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  // Returned by the Credentials `authorize` callback.
  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
