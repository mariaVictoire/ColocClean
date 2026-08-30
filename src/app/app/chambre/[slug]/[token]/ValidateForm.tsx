"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { whatsappDeepLink } from "@/lib/whatsapp/messages";

type Item = {
  id: string;
  label: string;
};

const SHARE_TIMEOUT_MS = 45_000;

function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

function proofFileName(file: File) {
  if (file.name) return file.name;
  if (isVideoFile(file)) return "preuve-menage.mp4";
  return "preuve-menage.jpg";
}

async function shareProof(
  file: File,
): Promise<"shared" | "aborted" | "unsupported" | "timeout"> {
  if (typeof navigator === "undefined" || !navigator.canShare) {
    return "unsupported";
  }

  const shareFile =
    file.type && file.name
      ? file
      : new File([file], proofFileName(file), {
          type: file.type || (isVideoFile(file) ? "video/mp4" : "image/jpeg"),
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
  const mediaRef = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const mediaIsVideo = media ? isVideoFile(media) : false;

  useEffect(() => {
    if (!media) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(media);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [media]);

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

  function onPickMedia() {
    setError(null);
    mediaRef.current?.click();
  }

  function onSendAndValidate() {
    setError(null);

    if (!ownerWhatsappNumber) {
      setError(
        "Le WhatsApp du bailleur n’est pas configuré. Contactez le propriétaire.",
      );
      return;
    }
    if (!media) {
      setError("Prenez d’abord une photo ou une vidéo.");
      return;
    }

    const mediaFile = media;

    startTransition(async () => {
      // Geste utilisateur → le partage peut s’ouvrir (WhatsApp)
      const shareResult = await shareProof(mediaFile);

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
        openLandlordChat();
        setError(
          "Partage indisponible. WhatsApp s’ouvre : joignez la photo ou la vidéo à la main.",
        );
        return;
      }

      // Pas d’upload serveur : la preuve reste uniquement sur WhatsApp
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
        setError(data?.error ?? "Envoyé, mais validation impossible.");
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
          1) Prenez une photo ou une courte vidéo · 2) Envoyez-la via WhatsApp
          (choisissez WhatsApp + le bailleur). La validation se fait après
          l’envoi. Rien n’est stocké dans l’application.
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
          ref={mediaRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setMedia(file);
            setError(null);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={onPickMedia}
          disabled={pending}
          className="touch-target mt-3 inline-flex w-full items-center justify-center rounded-xl border-2 border-dashed border-teal-600 bg-white text-base font-semibold text-teal-900 disabled:opacity-60"
        >
          {media
            ? mediaIsVideo
              ? "Reprendre une vidéo"
              : "Reprendre une photo"
            : "Photo ou vidéo"}
        </button>

        {previewUrl && mediaIsVideo && (
          <video
            src={previewUrl}
            controls
            playsInline
            className="mt-3 max-h-48 w-full rounded-xl bg-stone-900 object-contain"
          />
        )}

        {previewUrl && !mediaIsVideo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Aperçu de la preuve"
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
          disabled={pending || !media}
          className="touch-target mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 text-base font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Ouverture du partage…" : "Envoyer sur WhatsApp et valider"}
        </button>
      </section>
    </div>
  );
}
