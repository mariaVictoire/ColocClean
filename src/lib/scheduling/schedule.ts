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
import {
  cycleWeekIndexFromAnchor,
  fromDateOnlyUTC,
  generateRandomCycleAssignments,
  getFixedCycleAssignments,
  TASK_POSITION_TO_KEY,
  toDateOnlyUTC,
  type CycleAssignment,
  type TaskKey,
} from "@/lib/scheduling/fixed-cycle";

export function weekBoundsFor(date: Date) {
  const today = startOfDay(date);
  const weekStartLocal = today.getDay() === 1 ? today : previousMonday(today);
  const weekEndLocal = nextSunday(weekStartLocal);
  return {
    weekStart: toDateOnlyUTC(weekStartLocal),
    weekEnd: toDateOnlyUTC(weekEndLocal),
  };
}

export function deadlineFrom(weekEnd: Date, deadlineTime: string): Date {
  const [hours, minutes] = deadlineTime.split(":").map(Number);
  return setSeconds(
    setMinutes(setHours(weekEnd, hours || 18), minutes || 0),
    0,
  );
}

function resolveCycleAssignments(
  weekStart: Date,
  anchor: Date,
  previous: CycleAssignment[] | undefined,
): CycleAssignment[] {
  const index = cycleWeekIndexFromAnchor(weekStart, anchor);
  if (index >= 0 && index <= 5) {
    return getFixedCycleAssignments(index);
  }
  // Au-delà du cycle papier (ou avant l'ancre) → aléatoire avec contrainte filles
  return generateRandomCycleAssignments(previous);
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
        weekStart: toDateOnlyUTC(startOfDay(options.weekStart)),
        weekEnd: toDateOnlyUTC(nextSunday(startOfDay(options.weekStart))),
      }
    : weekBoundsFor(new Date());

  const weekStartLocal = fromDateOnlyUTC(weekStart);
  const weekEndLocal = fromDateOnlyUTC(weekEnd);

  const existing = await prisma.weeklySchedule.findUnique({
    where: {
      propertyId_weekStart: { propertyId, weekStart },
    },
    include: {
      assignments: { include: { room: true, task: true } },
    },
  });

  if (existing && !options?.force) {
    return { schedule: existing, created: false as const };
  }

  const replacedCycle: CycleAssignment[] | undefined = existing
    ? existing.assignments
        .map((a) => {
          const key = TASK_POSITION_TO_KEY[a.task.position];
          if (!key) return null;
          return { taskKey: key, roomNumber: a.room.number };
        })
        .filter((x): x is CycleAssignment => x !== null)
    : undefined;

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
    include: {
      assignments: { include: { room: true, task: true } },
    },
  });

  const previousFromLastWeek: CycleAssignment[] | undefined =
    previousSchedule?.assignments
      .map((a) => {
        const key = TASK_POSITION_TO_KEY[a.task.position];
        if (!key) return null;
        return { taskKey: key as TaskKey, roomNumber: a.room.number };
      })
      .filter((x): x is CycleAssignment => x !== null);

  const previous =
    replacedCycle && replacedCycle.length > 0
      ? replacedCycle
      : previousFromLastWeek;

  if (!property.cycleAnchorWeekStart) {
    // Nouvelle coloc : cette semaine = semaine 1 du cycle papier
    await prisma.property.update({
      where: { id: propertyId },
      data: { cycleAnchorWeekStart: weekStart },
    });
    property.cycleAnchorWeekStart = weekStart;
  }

  const cyclePairs = resolveCycleAssignments(
    weekStartLocal,
    fromDateOnlyUTC(property.cycleAnchorWeekStart),
    previous,
  );

  const taskByKey = new Map<TaskKey, (typeof tasks)[number]>();
  for (const task of tasks) {
    const key = TASK_POSITION_TO_KEY[task.position];
    if (key) taskByKey.set(key, task);
  }

  const roomByNumber = new Map(rooms.map((r) => [r.number, r]));

  const rotation: { roomId: string; taskId: string }[] = [];
  for (const pair of cyclePairs) {
    const room = roomByNumber.get(pair.roomNumber);
    const task = taskByKey.get(pair.taskKey);
    if (!room || !task) {
      throw new Error(
        `Mapping cycle invalide: tâche ${pair.taskKey} → chambre ${pair.roomNumber}`,
      );
    }
    rotation.push({ roomId: room.id, taskId: task.id });
  }

  const schedule = await prisma.$transaction(async (tx) => {
    const created = await tx.weeklySchedule.create({
      data: {
        propertyId,
        weekStart,
        weekEnd,
        deadline: deadlineFrom(weekEndLocal, property.deadlineTime),
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
