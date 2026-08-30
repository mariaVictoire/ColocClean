"use client";

import { useState, useTransition } from "react";
import { regenerateRoomQr, updateRoomWhatsApp } from "@/lib/actions/rooms";

export function RoomEditor({
  roomId,
  label,
  tenantName,
  whatsappNumber,
  qrPath,
}: {
  roomId: string;
  label: string;
  tenantName: string | null;
  whatsappNumber: string | null;
  qrPath: string;
}) {
  const [name, setName] = useState(tenantName ?? "");
  const [phone, setPhone] = useState(whatsappNumber ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-stone-900">{label}</h2>
          <p className="mt-0.5 break-all text-xs text-stone-500">{qrPath}</p>
        </div>
      </div>

      <label className="mt-4 block text-sm font-medium text-stone-700">
        Locataire
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="touch-target mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/30"
          placeholder="Prénom ou nom"
        />
      </label>

      <label className="mt-3 block text-sm font-medium text-stone-700">
        WhatsApp
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="touch-target mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/30"
          placeholder="+33600000000"
        />
      </label>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const res = await updateRoomWhatsApp(roomId, phone, name);
              setMessage(res.error ?? "Enregistré");
            });
          }}
          className="touch-target inline-flex flex-1 items-center justify-center rounded-xl bg-teal-700 px-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          Enregistrer
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Régénérer le QR de ${label} ? L'ancien lien ne fonctionnera plus.`)) {
              return;
            }
            setMessage(null);
            startTransition(async () => {
              await regenerateRoomQr(roomId);
              setMessage("QR régénéré");
            });
          }}
          className="touch-target inline-flex flex-1 items-center justify-center rounded-xl border border-stone-300 px-3 text-sm font-medium text-stone-700 disabled:opacity-60"
        >
          Nouveau QR
        </button>
      </div>
      {message && (
        <p className="mt-2 text-sm text-stone-600" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
