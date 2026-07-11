/**
 * Create or update a dashboard login account (there is no signup UI).
 *
 * Usage (Postgres must be running):
 *   pnpm user:create <email> <password> [name]
 *
 * Re-running with the same email updates the password.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: pnpm user:create <email> <password> [name]");
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
    update: { passwordHash, name: name ?? undefined },
    create: { email, passwordHash, name: name ?? undefined },
  });

  console.log(`✓ Saved user ${user.email} (${user.id})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
