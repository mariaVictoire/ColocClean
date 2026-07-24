import {
  addDays,
  nextSunday,
  previousMonday,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
} from "date-fns";
import { AssignmentStatus, WeeklyScheduleStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateBalancedRotation } from "@/lib/scheduling/rotation";

export function weekBoundsFor(date: Date) {
  const today = startOfDay(date);
  const weekStart = today.getDay() === 1 ? today : previousMonday(today);
  const weekEnd = nextSunday(weekStart);
  return { weekStart, weekEnd };
}

export function deadlineFrom(
  weekEnd: Date,
  deadlineTime: string,
): Date {
  const [hours, minutes] = deadlineTime.split(":").map(Number);
  return setSeconds(setMinutes(setHours(weekEnd, hours || 18), minutes || 0), 0);
}

export async function generateScheduleForProperty(
  propertyId: string,
  options?: { weekStart?: Date; force?: boolean },
) {
  const property = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
  });

  const { weekStart, weekEnd } = options?.weekStart
    ? {
        weekStart: startOfDay(options.weekStart),
        weekEnd: nextSunday(startOfDay(options.weekStart)),
      }
    : weekBoundsFor(new Date());

  const existing = await prisma.weeklySchedule.findUnique({
    where: {
      propertyId_weekStart: { propertyId, weekStart },
    },
    include: { assignments: true },
  });

  if (existing && !options?.force) {
    return { schedule: existing, created: false as const };
  }

  // En régénération : éviter de recoller le même planning qu'on remplace
  const replacedAssignments = (existing?.assignments ?? []).map((a) => ({
    roomId: a.roomId,
    taskId: a.taskId,
  }));

  if (existing && options?.force) {
    await prisma.weeklySchedule.delete({ where: { id: existing.id } });
  }

  const rooms = await prisma.room.findMany({
    where: { propertyId, isActive: true },
    orderBy: { number: "asc" },
  });
  const tasks = await prisma.task.findMany({
    where: { propertyId, isActive: true },
    include: { checklistItems: { orderBy: { position: "asc" } } },
    orderBy: { position: "asc" },
  });

  const previousSchedule = await prisma.weeklySchedule.findFirst({
    where: {
      propertyId,
      weekStart: { lt: weekStart },
    },
    orderBy: { weekStart: "desc" },
    include: { assignments: true },
  });

  const previousFromLastWeek = (previousSchedule?.assignments ?? []).map(
    (a) => ({
      roomId: a.roomId,
      taskId: a.taskId,
    }),
  );

  // Priorité : ne pas répéter le planning qu'on régénère, sinon la semaine d'avant
  const previous =
    replacedAssignments.length > 0
      ? replacedAssignments
      : previousFromLastWeek;

  const rotation = generateBalancedRotation(
    rooms.map((r) => ({ id: r.id, number: r.number })),
    tasks.map((t) => ({ id: t.id, difficulty: t.difficulty })),
    previous,
  );

  const deadline = deadlineFrom(weekEnd, property.deadlineTime);

  const schedule = await prisma.$transaction(async (tx) => {
    const created = await tx.weeklySchedule.create({
      data: {
        propertyId,
        weekStart,
        weekEnd,
        deadline,
        status: WeeklyScheduleStatus.ACTIVE,
        generatedAutomatically: true,
      },
    });

    for (const pair of rotation) {
      const task = tasks.find((t) => t.id === pair.taskId)!;
      const assignment = await tx.assignment.create({
        data: {
          weeklyScheduleId: created.id,
          roomId: pair.roomId,
          taskId: pair.taskId,
          status: AssignmentStatus.PENDING,
        },
      });

      if (task.checklistItems.length > 0) {
        await tx.assignmentChecklist.createMany({
          data: task.checklistItems.map((item) => ({
            assignmentId: assignment.id,
            checklistItemId: item.id,
            isChecked: false,
          })),
        });
      }
    }

    return created;
  });

  return { schedule, created: true as const };
}

export async function generateNextWeekIfNeeded(propertyId: string) {
  const { weekStart } = weekBoundsFor(new Date());
  // Si on est lundi (génération), cibler la semaine courante ;
  // sinon générer la semaine suivante à partir du prochain lundi.
  const today = startOfDay(new Date());
  const targetStart =
    today.getDay() === 1 ? weekStart : addDays(weekStart, 7);

  return generateScheduleForProperty(propertyId, { weekStart: targetStart });
}

export async function markLateAssignments(propertyId?: string) {
  const now = new Date();
  const schedules = await prisma.weeklySchedule.findMany({
    where: {
      status: WeeklyScheduleStatus.ACTIVE,
      deadline: { lt: now },
      ...(propertyId ? { propertyId } : {}),
    },
    include: {
      assignments: {
        where: { status: AssignmentStatus.PENDING },
      },
    },
  });

  let updated = 0;
  for (const schedule of schedules) {
    if (schedule.assignments.length === 0) continue;
    const result = await prisma.assignment.updateMany({
      where: {
        weeklyScheduleId: schedule.id,
        status: AssignmentStatus.PENDING,
      },
      data: { status: AssignmentStatus.LATE },
    });
    updated += result.count;
  }
  return updated;
}
