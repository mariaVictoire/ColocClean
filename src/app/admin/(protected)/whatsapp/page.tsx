import { AssignmentStatus, ReminderType } from "@prisma/client";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getDefaultProperty } from "@/lib/property";
import { weekBoundsFor } from "@/lib/scheduling/schedule";
import {
  fillWhatsAppTemplate,
  shortValidationPath,
  templateForType,
  whatsappDeepLink,
} from "@/lib/whatsapp/messages";
import { REMINDER_TYPE_LABELS, WHATSAPP_REMINDER_OPTIONS } from "@/lib/constants/reminders";
import { StatusBadge } from "@/components/StatusBadge";
import { appConfig } from "@/config/app";
import { WhatsAppRowActions } from "./WhatsAppRowActions";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `WhatsApp — ${appConfig.name}`,
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

export default async function WhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireOwner();
  const { type: typeParam } = await searchParams;
  const type: ReminderType =
    typeParam === "LATE" ? "LATE" : "FRIDAY";

  const baseUrl = await getBaseUrl();
  const property = await getDefaultProperty();
  const { weekStart } = weekBoundsFor(new Date());
  const schedule = await prisma.weeklySchedule.findUnique({
    where: {
      propertyId_weekStart: { propertyId: property.id, weekStart },
    },
    include: {
      assignments: {
        where: {
          status: {
            in: [
              AssignmentStatus.PENDING,
              AssignmentStatus.LATE,
              AssignmentStatus.UPCOMING,
            ],
          },
        },
        include: {
          room: true,
          task: true,
          reminders: {
            where: { type },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { room: { number: "asc" } },
      },
    },
  });

  const template = templateForType(type, property);

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">
          Rappels WhatsApp
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Ouvre WhatsApp avec le message déjà rédigé — pas d&apos;API Business.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {WHATSAPP_REMINDER_OPTIONS.map((optType) => (
          <a
            key={optType}
            href={`/admin/whatsapp?type=${optType}`}
            className={`touch-target inline-flex shrink-0 items-center rounded-xl px-3 text-sm font-medium ${
              type === optType
                ? "bg-teal-700 text-white"
                : "border border-stone-300 text-stone-700"
            }`}
          >
            {REMINDER_TYPE_LABELS[optType]}
          </a>
        ))}
      </div>

      {!schedule || schedule.assignments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600">
          Aucune tâche en attente cette semaine.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {schedule.assignments.map((a) => {
            const lien = `${baseUrl}${shortValidationPath(a.room.qrToken)}`;
            const message = fillWhatsAppTemplate(template, {
              numero_chambre: a.room.number,
              nom_tache: a.task.name,
              date_limite: schedule.deadline,
              lien_validation: lien,
            });
            const deepLink = a.room.whatsappNumber
              ? whatsappDeepLink(a.room.whatsappNumber, message)
              : null;
            const last = a.reminders[0] ?? null;

            return (
              <li
                key={a.id}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-stone-900">{a.room.label}</p>
                    <p className="text-sm text-stone-500">{a.task.name}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-stone-50 p-3 text-xs text-stone-600">
                  {message}
                </pre>
                <div className="mt-3">
                  <WhatsAppRowActions
                    assignmentId={a.id}
                    type={type}
                    deepLink={deepLink}
                    lastReminderId={last?.id ?? null}
                    lastSent={!!last?.markedAsSentAt}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
