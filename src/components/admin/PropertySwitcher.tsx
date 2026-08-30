"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createColocation,
  switchActiveProperty,
} from "@/lib/actions/property";

type PropertyOption = {
  id: string;
  name: string;
};

export function PropertySwitcher({
  properties,
  activePropertyId,
}: {
  properties: PropertyOption[];
  activePropertyId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSwitch(propertyId: string) {
    if (propertyId === activePropertyId) return;
    setError(null);
    startTransition(async () => {
      const result = await switchActiveProperty(propertyId);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createColocation(newName);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setNewName("");
      setCreating(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-stone-600">Colocation active</p>
        {!creating && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50 active:bg-teal-100 disabled:opacity-60"
            aria-label="Nouvelle colocation"
            title="Nouvelle colocation"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-4"
              aria-hidden
            >
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span>Nouvelle</span>
          </button>
        )}
      </div>

      <label className="sr-only" htmlFor="active-property">
        Colocation active
      </label>
      <select
        id="active-property"
        value={activePropertyId}
        disabled={pending || properties.length === 0}
        onChange={(e) => onSwitch(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-sm font-semibold text-stone-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
      >
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {creating && (
        <form onSubmit={onCreate} className="mt-2 flex flex-col gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom (ex. Rue de la Paix)"
            className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-teal-700"
            required
            minLength={2}
            maxLength={80}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
