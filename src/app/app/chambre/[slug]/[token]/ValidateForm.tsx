"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Item = {
  id: string;
  label: string;
};

async function sharePhoto(
  file: File,
): Promise<"shared" | "aborted" | "unsupported"> {
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
    await navigator.share({ files: [shareFile] });
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
  const pendingSendRef = useRef(false);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function finishValidation(photoFile: File) {
    setError(null);

    if (!ownerWhatsappNumber) {
      setError(
        "Le WhatsApp du bailleur n’est pas configuré. Contactez le propriétaire.",
      );
      pendingSendRef.current = false;
      return;
    }

    startTransition(async () => {
      // 1) Partage de la vraie photo (choisir WhatsApp → le bailleur)
      const shareResult = await sharePhoto(photoFile);

      if (shareResult === "aborted") {
        setError("Envoi annulé. La tâche n’est pas validée.");
        pendingSendRef.current = false;
        return;
      }

      if (shareResult === "unsupported") {
        setError(
          "Le partage photo n’est pas dispo sur cet appareil. Utilisez un smartphone.",
        );
        pendingSendRef.current = false;
        return;
      }

      // 2) Validation seulement si le partage a bien abouti
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
        pendingSendRef.current = false;
        return;
      }

      pendingSendRef.current = false;
      router.refresh();
    });
  }

  function onMainClick() {
    setError(null);

    if (!ownerWhatsappNumber) {
      setError(
        "Le WhatsApp du bailleur n’est pas configuré. Contactez le propriétaire.",
      );
      return;
    }

    if (!photo) {
      pendingSendRef.current = true;
      cameraRef.current?.click();
      return;
    }

    finishValidation(photo);
  }

  function onPhotoPicked(file: File | null) {
    if (!file) {
      pendingSendRef.current = false;
      return;
    }
    setPhoto(file);
    setError(null);
    if (pendingSendRef.current) {
      finishValidation(file);
    }
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
          Prenez une photo, puis choisissez <strong>WhatsApp</strong> et le
          bailleur pour envoyer l’image. La tâche n’est validée qu’après l’envoi.
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
            onPhotoPicked(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />

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
          onClick={onMainClick}
          disabled={pending}
          className="touch-target mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 text-base font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Envoyer la photo et valider"}
        </button>
      </section>
    </div>
  );
}
