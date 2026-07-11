/**
 * Create or update a dashboard login account. Mainly for seeding the first
 * ADMIN — after that, admins create users at /admin/users.
 *
 * Usage (Postgres must be running):
 *   pnpm user:create <email> <password> [name] [USER|ADMIN]
 *
 * Role defaults to USER. Re-running with the same email updates the password
 * (and role, if given).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const [email, password, name, roleArg] = process.argv.slice(2);
  const role = roleArg?.toUpperCase() === "ADMIN" ? "ADMIN" : "USER";

  if (!email || !password) {
    console.error(
      "Usage: pnpm user:create <email> <password> [name] [USER|ADMIN]",
    );
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set (is it in your .env?).");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: name ?? undefined, role },
    create: { email, passwordHash, name: name ?? undefined, role },
  });

  console.log(`✓ Saved user ${user.email} (${user.role}, ${user.id})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
