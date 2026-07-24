import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Migrations CLI → préférer DIRECT_URL (session pooler :5432).
 * Runtime Prisma Client → DATABASE_URL (transaction :6543) via schema.prisma.
 * Placeholder uniquement pour `prisma generate` sans secrets.
 */
const migrateUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: migrateUrl,
  },
});
