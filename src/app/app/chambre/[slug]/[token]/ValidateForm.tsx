"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Item = {
  id: string;
  label: string;
  isRequired: boolean;
  isChecked: boolean;
};

export function ValidateForm({
  assignmentId,
  token,
  slug,
  photoRequired,
  items,
}: {
  assignmentId: string;
  token: string;
  slug: string;
  photoRequired: boolean;
  items: Item[];
}) {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.isChecked])),
  );
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allRequiredOk = items
    .filter((i) => i.isRequired)
    .every((i) => checked[i.id]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!allRequiredOk) {
      setError("Cochez tous les points de la liste avant de valider.");
      return;
    }
    if (photoRequired && !photo) {
      setError("Une photo est obligatoire.");
      return;
    }

    startTransition(async () => {
      const body = new FormData();
      body.set("assignmentId", assignmentId);
      body.set("token", token);
      body.set("slug", slug);
      body.set("comment", comment);
      body.set(
        "checkedIds",
        JSON.stringify(
          Object.entries(checked)
            .filter(([, v]) => v)
            .map(([id]) => id),
        ),
      );
      if (photo) body.set("photo", photo);

      const res = await fetch("/api/public/validate", {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        setError(data?.error ?? "Validation impossible.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
      <fieldset className="rounded-2xl border border-stone-200 bg-white/90 p-4">
        <legend className="px-1 text-sm font-semibold text-stone-900">
          Ce qu’il faut faire
        </legend>
        <p className="mb-3 text-sm text-stone-600">
          Cochez chaque point au fur et à mesure. Tout doit être fait avant de
          valider.
        </p>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-stone-800">
                <input
                  type="checkbox"
                  checked={!!checked[item.id]}
                  onChange={(e) =>
                    setChecked((prev) => ({
                      ...prev,
                      [item.id]: e.target.checked,
                    }))
                  }
                  className="mt-1 h-5 w-5 rounded border-stone-300 text-teal-700 focus:ring-teal-700"
                />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <section className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
        <h2 className="font-semibold text-teal-950">
          Vous avez fait votre tâche ?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-teal-900/90">
          Si vous avez tout nettoyé selon la liste ci-dessus, merci de valider
          ci-dessous. Cela informe le propriétaire que le ménage est terminé.
        </p>

        <label className="mt-4 block text-sm font-medium text-stone-700">
          Commentaire (optionnel)
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Ex. : produit manquant, problème signalé…"
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/30"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-stone-700">
          Photo {photoRequired ? "(obligatoire)" : "(optionnelle)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="mt-1.5 block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-900"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !allRequiredOk}
          className="touch-target mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 text-base font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Validation…" : "Oui, j’ai tout nettoyé — valider"}
        </button>
      </section>
    </form>
  );
}
