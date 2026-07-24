import { spawnSync } from "node:child_process";

/**
 * Build Vercel :
 * - Les migrations sont déjà appliquées sur Supabase (en local).
 * - On ne bloque plus le build si DATABASE_URL manque ici ;
 *   l'app en runtime en aura besoin (à configurer dans Vercel).
 */
console.log("[build] env present:", {
  DATABASE_URL: Boolean(process.env.DATABASE_URL),
  DIRECT_URL: Boolean(process.env.DIRECT_URL),
  AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
  AUTH_URL: Boolean(process.env.AUTH_URL),
  VERCEL_ENV: process.env.VERCEL_ENV ?? "(none)",
  VERCEL_URL: process.env.VERCEL_URL ?? "(none)",
});

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
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

// Migrations : uniquement si DATABASE_URL est bien injectée par Vercel
if (process.env.DATABASE_URL) {
  run("npx", ["prisma", "migrate", "deploy"]);
} else {
  console.warn(
    "[build] DATABASE_URL absent au build — skip migrate deploy. " +
      "Vérifie Settings → Environment Variables sur le BON projet Vercel, puis Redeploy.",
  );
}

run("npx", ["next", "build"]);
