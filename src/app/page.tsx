import Link from "next/link";
import { appConfig } from "@/config/app";

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_#99f6e4_0%,_transparent_55%),linear-gradient(180deg,_#f0fdfa_0%,_#fafaf9_40%,_#f5f5f4_100%)]"
      />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pb-4 pt-[max(1rem,var(--safe-top))] sm:px-6 sm:py-6">
        <p className="font-display text-lg font-bold tracking-tight text-teal-900 sm:text-xl">
          {appConfig.name}
        </p>
        <Link
          href="/admin/connexion"
          className="touch-target inline-flex shrink-0 items-center justify-center rounded-xl bg-teal-700 px-3.5 text-sm font-semibold text-white hover:bg-teal-800 sm:px-4"
        >
          <span className="sm:hidden">Connexion</span>
          <span className="hidden sm:inline">Espace propriétaire</span>
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:pb-20 sm:pt-8">
        <p className="font-display text-[2.35rem] font-bold leading-[1.1] tracking-tight text-teal-950 sm:text-6xl">
          {appConfig.name}
        </p>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600 sm:mt-5 sm:text-lg">
          {appConfig.description} Rotation équilibrée, QR codes permanents,
          rappels WhatsApp préparés — sans compte pour les locataires.
        </p>
        <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:max-w-md sm:flex-row sm:flex-wrap">
          <Link
            href="/admin/connexion"
            className="touch-target inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 sm:w-auto"
          >
            Accéder au tableau de bord
          </Link>
          <a
            href="#comment-ca-marche"
            className="touch-target inline-flex w-full items-center justify-center rounded-xl border border-stone-300 bg-white/70 px-5 text-sm font-semibold text-stone-700 hover:bg-white sm:w-auto"
          >
            Comment ça marche
          </a>
        </div>
      </section>

      <section
        id="comment-ca-marche"
        className="scroll-mt-4 border-t border-stone-200/80 bg-white/50 py-10 pb-[max(2.5rem,var(--safe-bottom))] sm:py-14"
      >
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 sm:grid-cols-3 sm:gap-8 sm:px-6">
          {[
            {
              title: "Planning auto",
              text: "Chaque lundi, une répartition équilibrée des 6 tâches entre les chambres.",
            },
            {
              title: "QR permanent",
              text: "Chaque chambre scanne son QR pour voir sa tâche et valider le ménage.",
            },
            {
              title: "Rappels WhatsApp",
              text: "Le propriétaire ouvre des messages déjà rédigés, sans API Business.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-lg font-semibold text-teal-950">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
