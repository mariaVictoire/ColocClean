import Link from "next/link";
import { appConfig } from "@/config/app";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: `Connexion — ${appConfig.name}`,
};

export default function ConnexionPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-8 pt-[max(2rem,var(--safe-top))] pb-[max(2rem,var(--safe-bottom))] sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#ccfbf1_0%,_#fafaf9_45%,_#f5f5f4_100%)]"
      />
      <div className="mb-6 w-full max-w-md text-center sm:mb-8">
        <Link href="/" className="inline-block">
          <p className="font-display text-2xl font-bold tracking-tight text-teal-900 sm:text-3xl">
            {appConfig.name}
          </p>
        </Link>
        <p className="mt-2 text-sm text-stone-600 sm:text-base">
          Espace propriétaire
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-8">
        <h1 className="mb-5 text-lg font-semibold text-stone-900 sm:mb-6 sm:text-xl">
          Connexion
        </h1>
        <LoginForm />
        <p className="mt-5 text-center text-sm text-stone-500 sm:mt-6">
          <Link
            href="/admin/mot-de-passe-oublie"
            className="touch-target inline-flex items-center justify-center text-teal-700 underline-offset-2 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
    </main>
  );
}
