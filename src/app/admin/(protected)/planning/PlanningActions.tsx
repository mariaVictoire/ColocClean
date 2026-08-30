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

export function ExcuseButton({
  assignmentId,
  status,
}: {
  assignmentId: string;
  status: "EXCUSED" | "PENDING" | "COMPLETED" | "LATE" | "UPCOMING" | "CANCELLED";
}) {
  const [pending, startTransition] = useTransition();
  const isExcused = status === "EXCUSED";

  return (
    <button
      type="button"
      disabled={pending}
      title={
        isExcused
          ? "Remettre la tâche comme à faire"
          : "Dispenser la chambre de cette tâche pour cette semaine"
      }
      onClick={() => {
        if (isExcused) {
          startTransition(async () => {
            await markAssignmentStatus(assignmentId, "PENDING");
          });
          return;
        }
        if (
          !confirm(
            "Exempter cette chambre pour cette semaine ? La tâche ne sera plus attendue ni en retard.",
          )
        ) {
          return;
        }
        startTransition(async () => {
          await markAssignmentStatus(assignmentId, "EXCUSED");
        });
      }}
      className={`touch-target inline-flex items-center justify-center rounded-xl border px-3 text-xs font-semibold disabled:opacity-50 ${
        isExcused
          ? "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100"
          : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 active:bg-stone-100"
      }`}
    >
      {pending ? "…" : isExcused ? "Annuler l’excuse" : "Exempter"}
    </button>
  );
}
