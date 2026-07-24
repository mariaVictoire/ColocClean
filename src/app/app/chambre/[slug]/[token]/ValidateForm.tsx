"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { whatsappDeepLink } from "@/lib/whatsapp/messages";

type Item = {
  id: string;
  label: string;
};

const SHARE_TIMEOUT_MS = 45_000;

async function sharePhoto(
  file: File,
): Promise<"shared" | "aborted" | "unsupported" | "timeout"> {
  if (typeof navigator === "undefined" || !navigator.canShare) {
    return "unsupported";
  }

  const shareFile =
    file.type && file.name
      ? file
      : new File([file], "preuve-menage.jpg", {
          type: file.type || "image/jpeg",
        });

  if (!navigator.canShare({ files: [shareFile] })) {
    return "unsupported";
  }

  try {
    const result = await Promise.race([
      navigator.share({ files: [shareFile] }).then(() => "shared" as const),
      new Promise<"timeout">((resolve) => {
        setTimeout(() => resolve("timeout"), SHARE_TIMEOUT_MS);
      }),
    ]);
    return result === "timeout" ? "timeout" : "shared";
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
  const cameraRef = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function openLandlordChat() {
    if (!ownerWhatsappNumber) return;
    const link = whatsappDeepLink(
      ownerWhatsappNumber,
      `${roomLabel} — ${taskName} terminé.`,
    );
    if (link) {
      window.location.href = link;
    }
  }

  function onTakePhoto() {
    setError(null);
    cameraRef.current?.click();
  }

  function onSendAndValidate() {
    setError(null);

    if (!ownerWhatsappNumber) {
      setError(
        "Le WhatsApp du bailleur n’est pas configuré. Contactez le propriétaire.",
      );
      return;
    }
    if (!photo) {
      setError("Prenez d’abord une photo.");
      return;
    }

    const photoFile = photo;

    startTransition(async () => {
      // Important : ce clic est un geste utilisateur → le partage peut s’ouvrir
      const shareResult = await sharePhoto(photoFile);

      if (shareResult === "aborted") {
        setError("Envoi annulé. La tâche n’est pas validée.");
        return;
      }

      if (shareResult === "timeout") {
        setError(
          "Le partage a mis trop de temps. Réessayez et choisissez WhatsApp.",
        );
        return;
      }

      if (shareResult === "unsupported") {
        // Repli : ouvre la discussion bailleur (texte). La photo reste à joindre.
        openLandlordChat();
        setError(
          "Partage photo indisponible. WhatsApp s’ouvre : joignez la photo à la main.",
        );
        return;
      }

      const body = new FormData();
      body.set("assignmentId", assignmentId);
      body.set("token", token);
      body.set("slug", slug);
      body.set("comment", comment);
      body.set("photo", photoFile);

      const res = await fetch("/api/public/validate", {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        setError(data?.error ?? "Photo envoyée, mais validation impossible.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="mt-5 flex flex-col gap-4">
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
          1) Prenez la photo · 2) Envoyez-la via WhatsApp (choisissez WhatsApp +
          le bailleur). La validation se fait après l’envoi.
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

        <input
          ref={cameraRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setPhoto(file);
            setError(null);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={onTakePhoto}
          disabled={pending}
          className="touch-target mt-3 inline-flex w-full items-center justify-center rounded-xl border-2 border-dashed border-teal-600 bg-white text-base font-semibold text-teal-900 disabled:opacity-60"
        >
          {photo ? "Reprendre une photo" : "Prendre une photo"}
        </button>

        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Aperçu de la photo"
            className="mt-3 max-h-48 w-full rounded-xl object-cover"
          />
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onSendAndValidate}
          disabled={pending || !photo}
          className="touch-target mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 text-base font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Ouverture du partage…" : "Envoyer sur WhatsApp et valider"}
        </button>
      </section>
    </div>
  );
}
