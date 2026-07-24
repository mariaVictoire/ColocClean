"use client";

import { useState, useTransition } from "react";
import {
  generateCurrentWeekSchedule,
  markAssignmentStatus,
  regenerateCurrentWeekSchedule,
  runMarkLateNow,
} from "./actions";

export function PlanningActions({ hasSchedule }: { hasSchedule: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {!hasSchedule ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await generateCurrentWeekSchedule();
              setMessage(res.message);
            })
          }
          className="touch-target inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          Générer le planning
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              !confirm(
                "Régénérer efface les validations de la semaine. Continuer ?",
              )
            ) {
              return;
            }
            startTransition(async () => {
              const res = await regenerateCurrentWeekSchedule();
              setMessage(res.message);
            });
          }}
          className="touch-target inline-flex items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-700 disabled:opacity-60"
        >
          Régénérer
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await runMarkLateNow();
            setMessage(`${res.count} tâche(s) marquée(s) en retard.`);
          })
        }
        className="touch-target inline-flex items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-700 disabled:opacity-60"
      >
        Marquer les retards
      </button>
      {message && (
        <p className="w-full text-sm text-stone-600" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

export function ExcuseButton({ assignmentId }: { assignmentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAssignmentStatus(assignmentId, "EXCUSED");
        })
      }
      className="text-xs font-medium text-stone-500 underline-offset-2 hover:underline disabled:opacity-50"
    >
      Excusé
    </button>
  );
}
