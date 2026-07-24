"use client";

import { useTransition } from "react";
import type { ReminderType } from "@prisma/client";
import { markReminderSent, prepareReminder } from "./actions";

export function WhatsAppRowActions({
  assignmentId,
  type,
  deepLink,
  lastReminderId,
  lastSent,
}: {
  assignmentId: string;
  type: ReminderType;
  deepLink: string | null;
  lastReminderId: string | null;
  lastSent: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!deepLink) {
    return (
      <span className="text-xs text-stone-400">Pas de numéro WhatsApp</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={deepLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          startTransition(async () => {
            await prepareReminder(assignmentId, type);
          });
        }}
        className="touch-target inline-flex items-center justify-center rounded-xl bg-teal-700 px-3 text-sm font-semibold text-white"
      >
        Ouvrir WhatsApp
      </a>
      {lastReminderId && !lastSent && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markReminderSent(lastReminderId);
            })
          }
          className="touch-target inline-flex items-center justify-center rounded-xl border border-stone-300 px-3 text-sm font-medium text-stone-700 disabled:opacity-60"
        >
          Marquer envoyé
        </button>
      )}
      {lastSent && (
        <span className="inline-flex items-center text-xs font-medium text-green-700">
          Envoyé
        </span>
      )}
    </div>
  );
}
