"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Item = {
  id: string;
  label: string;
};

async function sendProofToOwner(photo: File | null, whatsappUrl: string | null, text: string) {
  if (photo && typeof navigator !== "undefined" && navigator.canShare) {
    try {
      const file =
        photo.type && photo.name
          ? photo
          : new File([photo], "preuve-menage.jpg", {
              type: photo.type || "image/jpeg",
            });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text,
          title: "Preuve ménage",
        });
        return;
      }
    } catch {
      // Annulé ou non supporté → fallback wa.me
    }
  }

  if (whatsappUrl) {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }
}

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
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

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

      const res = await fetch("/api/public/validate", {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        whatsappUrl?: string | null;
        message?: string;
      } | null;

      if (!res.ok) {
        setError(data?.error ?? "Validation impossible.");
        return;
      }

      await sendProofToOwner(
        photo,
        data?.whatsappUrl ?? null,
        data?.message ?? "Ménage terminé.",
      );

      if (!data?.whatsappUrl) {
        setInfo(
          "Validé. Ajoutez le WhatsApp du bailleur dans Admin → Chambres pour l’envoi photo.",
        );
      }

      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
      <section className="rounded-2xl border border-stone-200 bg-white/90 p-4">
        <h2 className="text-sm font-semibold text-stone-900">
          Rappel — ce qu’il faut faire
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Liste indicative pour vous guider. Pas besoin de cocher chaque point.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-800">
          {items.map((item) => (
            <li key={item.id}>{item.label}</li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
        <h2 className="font-semibold text-teal-950">
          Vous avez fait votre tâche ?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-teal-900/90">
          Validez puis envoyez la photo au propriétaire via WhatsApp (choisissez
          WhatsApp dans le menu de partage).
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
          Photo pour le bailleur {photoRequired ? "(obligatoire)" : "(recommandée)"}
          <input
            type="file"
            accept="image/*"
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
        {info && (
          <p
            role="status"
            className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="touch-target mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 text-base font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Validation…" : "Valider et envoyer la photo"}
        </button>
      </section>
    </form>
  );
}
