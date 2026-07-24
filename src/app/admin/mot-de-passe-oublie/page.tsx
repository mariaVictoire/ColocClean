import Link from "next/link";
import { appConfig } from "@/config/app";

export const metadata = {
  title: `Mot de passe oublié — ${appConfig.name}`,
};

export default function MotDePasseOubliePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-8 pt-[max(2rem,var(--safe-top))] pb-[max(2rem,var(--safe-bottom))] sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#ccfbf1_0%,_#fafaf9_45%,_#f5f5f4_100%)]"
      />
      <div className="w-full max-w-md rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-8">
        <h1 className="text-lg font-semibold text-stone-900 sm:text-xl">
          Mot de passe oublié
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          La réinitialisation par email sera disponible prochainement. Pour le
          MVP, contactez l&apos;administrateur technique ou utilisez le compte
          de démonstration documenté dans le README.
        </p>
        <Link
          href="/admin/connexion"
          className="touch-target mt-6 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 sm:w-auto"
        >
          Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
