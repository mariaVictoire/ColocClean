import { spawnSync } from "node:child_process";

/**
 * Sur Vercel, certaines variables peuvent manquer au moment du build.
 * Prisma exige DIRECT_URL (schema.prisma) : on le dérive de DATABASE_URL si besoin.
 */
console.log("[build] env present:", {
  DATABASE_URL: Boolean(process.env.DATABASE_URL),
  DIRECT_URL: Boolean(process.env.DIRECT_URL),
  AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
  VERCEL_ENV: process.env.VERCEL_ENV ?? "(none)",
});

if (!process.env.DATABASE_URL) {
  console.error(
    "Missing DATABASE_URL.\n" +
      "In Vercel → Settings → Environment Variables, each variable must have Production checked (not only Development), then Redeploy.",
  );
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
