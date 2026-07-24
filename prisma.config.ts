import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Sur Vercel, `postinstall` → `prisma generate` tourne avant que l’app
 * n’ait besoin d’une vraie DB. Un placeholder suffit pour generate ;
 * migrate/runtime exigent les vraies variables Vercel.
 */
const databaseUrl =
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
    url: databaseUrl,
  },
});
