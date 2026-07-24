"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { whatsappDeepLink } from "@/lib/whatsapp/messages";

type Item = {
  id: string;
  label: string;
};

type ShareResult = "shared" | "aborted" | "unsupported";

async function sharePhotoToWhatsApp(
  photo: File,
  text: string,
): Promise<ShareResult> {
  if (typeof navigator === "undefined" || !navigator.canShare) {
    return "unsupported";
  }

  const file =
    photo.type && photo.name
      ? photo
      : new File([photo], "preuve-menage.jpg", {
          type: photo.type || "image/jpeg",
        });

  if (!navigator.canShare({ files: [file] })) {
    return "unsupported";
  }

  try {
    await navigator.share({
      files: [file],
      text,
      title: "Preuve ménage",
    });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "aborted";
    }
    return "aborted";
  }
}

export function ValidateForm({
  assignmentId,
  token,
  slug,
  items,
  ownerWhatsappNumber,
  roomLabel,
  taskName,
  weekLabel,
}: {
  assignmentId: string;
  token: string;
  slug: string;
  items: Item[];
  ownerWhatsappNumber: string | null;
  roomLabel: string;
  taskName: string;
  weekLabel: string;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"capture" | "confirm">("capture");
  const [pending, startTransition] = useTransition();

  const proofMessage = (() => {
    let message = `✅ ${roomLabel} — ${taskName} terminé (semaine du ${weekLabel}).`;
    if (comment.trim()) {
      message += `\nCommentaire : ${comment.trim()}`;
    }
    return message;
  })();

  function onStartSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!ownerWhatsappNumber) {
      setError(
        "Le WhatsApp du bailleur n’est pas configuré. Contactez le propriétaire.",
      );
      return;
    }
    if (!photo) {
      setError("Prenez une photo avant d’envoyer.");
      return;
    }

    startTransition(async () => {
      const result = await sharePhotoToWhatsApp(photo, proofMessage);

      if (result === "aborted") {
        setError(
          "Envoi annulé. La tâche n’est pas validée — renvoyez la photo.",
        );
        setStep("capture");
        return;
      }

      if (result === "unsupported") {
        const link = whatsappDeepLink(ownerWhatsappNumber, proofMessage);
        if (!link) {
          setError("Impossible d’ouvrir WhatsApp sur cet appareil.");
          return;
        }
        window.open(link, "_blank", "noopener,noreferrer");
        setStep("confirm");
        setError(null);
        return;
      }

      setStep("confirm");
      setError(null);
    });
  }

  function onConfirmSent() {
    setError(null);
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
      } | null;

      if (!res.ok) {
        setError(data?.error ?? "Validation impossible.");
        return;
      }

      router.refresh();
    });
  }

  function onCancelConfirm() {
    setStep("capture");
    setError("Validation annulée. Renvoyez la photo pour valider.");
  }

  return (
    <form onSubmit={onStartSend} className="mt-5 flex flex-col gap-4">
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
          1) Prenez une photo · 2) Envoyez-la au bailleur via WhatsApp · 3)
          Confirmez l’envoi. Sans confirmation, la tâche reste non validée.
        </p>

        {step === "capture" && (
          <>
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
              Photo pour le bailleur (obligatoire)
              <input
                type="file"
                accept="image/*"
                capture="environment"
                required
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-900"
              />
            </label>

            <button
              type="submit"
              disabled={pending}
              className="touch-target mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 text-base font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Ouverture WhatsApp…" : "Envoyer la photo sur WhatsApp"}
            </button>
          </>
        )}

        {step === "confirm" && (
          <div className="mt-4 space-y-3">
            <p className="rounded-xl bg-white/80 px-3 py-2 text-sm text-teal-950">
              Avez-vous bien <strong>envoyé</strong> le message avec la photo au
              bailleur dans WhatsApp ?
            </p>
            <button
              type="button"
              onClick={onConfirmSent}
              disabled={pending}
              className="touch-target inline-flex w-full items-center justify-center rounded-xl bg-teal-700 text-base font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Validation…" : "Oui, j’ai envoyé — valider la tâche"}
            </button>
            <button
              type="button"
              onClick={onCancelConfirm}
              disabled={pending}
              className="touch-target inline-flex w-full items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-800 disabled:opacity-60"
            >
              Non, annuler
            </button>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </section>
    </form>
  );
}
