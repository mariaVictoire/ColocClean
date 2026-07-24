"use client";

import { useState, useTransition } from "react";
import { updateOwnerWhatsApp } from "@/lib/actions/property";

export function OwnerWhatsAppEditor({
  ownerWhatsappNumber,
}: {
  ownerWhatsappNumber: string | null;
}) {
  const [phone, setPhone] = useState(ownerWhatsappNumber ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateOwnerWhatsApp(phone);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage("Numéro bailleur enregistré.");
    });
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
      <h2 className="text-sm font-semibold text-teal-950">
        WhatsApp du bailleur
      </h2>
      <p className="mt-1 text-sm text-teal-900/80">
        Après validation, le colocateur envoie la photo de preuve sur ce numéro.
      </p>
      <label className="mt-3 block text-sm font-medium text-stone-700">
        Numéro (ex. +33612345678)
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+336…"
          className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/30"
        />
      </label>
      {message && (
        <p className="mt-2 text-sm text-stone-700" role="status">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="touch-target mt-3 inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </section>
  );
}
