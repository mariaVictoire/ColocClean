import { spawnSync } from "node:child_process";

/**
 * Sur Vercel, certaines variables peuvent manquer au moment du build.
 * Prisma exige DIRECT_URL (schema.prisma) : on le dérive de DATABASE_URL si besoin.
 */
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.warn("DIRECT_URL missing — using DATABASE_URL as fallback");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["next", "build"]);
