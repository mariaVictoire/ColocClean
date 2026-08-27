import {
  differenceInCalendarWeeks,
  startOfDay,
} from "date-fns";

/**
 * Planning papier ColocClean (6 semaines), puis rotation aléatoire.
 *
 * Positions tâches en base (1..6) :
 * 1 Cuisine | 2 Salle de bain 1 | 3 Salle de bain 2 | 4 WC 1 | 5 Espace commun | 6 Poubelles
 *
 * Salle de bain 1 + WC 1 = filles → chambres 1, 3 ou 4 uniquement (souvent la même).
 */

export const GIRLS_ROOM_NUMBERS = [1, 3, 4] as const;

export const TASK_KEYS = [
  "cuisine",
  "sdb1",
  "sdb2",
  "wc1",
  "espace",
  "poubelles",
] as const;

export type TaskKey = (typeof TASK_KEYS)[number];

/** position (1..6) → clé */
export const TASK_POSITION_TO_KEY: Record<number, TaskKey> = {
  1: "cuisine",
  2: "sdb1",
  3: "sdb2",
  4: "wc1",
  5: "espace",
  6: "poubelles",
};

/**
 * Semaines 1→6 du tableau papier : pour chaque tâche, numéro de chambre.
 * Une même chambre peut avoir plusieurs tâches (ex. filles = sdb1+wc1).
 */
export const FIXED_CYCLE_BY_TASK: Record<TaskKey, number[]> = {
  //              S1 S2 S3 S4 S5 S6
  cuisine: [6, 5, 4, 3, 2, 1],
  sdb1: [1, 4, 3, 1, 4, 3],
  sdb2: [2, 6, 3, 5, 6, 2],
  wc1: [1, 4, 3, 1, 4, 3],
  espace: [3, 2, 1, 4, 6, 5],
  poubelles: [1, 2, 3, 4, 5, 6],
};

export type CycleAssignment = {
  taskKey: TaskKey;
  roomNumber: number;
};

/** Jour civil local → Date @db.Date (minuit UTC de ce jour). */
export function toDateOnlyUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Lit un @db.Date Prisma comme jour civil local. */
export function fromDateOnlyUTC(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Semaine du cycle 0..5 (0 = semaine 1 du papier). */
export function getFixedCycleAssignments(
  cycleWeekIndex: number,
): CycleAssignment[] {
  if (cycleWeekIndex < 0 || cycleWeekIndex > 5) {
    throw new Error(`Index de cycle hors plage: ${cycleWeekIndex}`);
  }
  return TASK_KEYS.map((taskKey) => ({
    taskKey,
    roomNumber: FIXED_CYCLE_BY_TASK[taskKey][cycleWeekIndex],
  }));
}

/**
 * Après les 6 semaines fixes : aléatoire.
 * - sdb1 + wc1 → même chambre parmi 1,3,4 (évite la précédente si possible)
 * - les 4 autres tâches → 4 chambres distinctes parmi les 5 restantes (1 chambre au repos)
 */
export function generateRandomCycleAssignments(
  previous?: CycleAssignment[],
): CycleAssignment[] {
  const prevGirl = previous?.find((a) => a.taskKey === "sdb1")?.roomNumber;
  const girlCandidates = GIRLS_ROOM_NUMBERS.filter((n) => n !== prevGirl);
  const girlPool =
    girlCandidates.length > 0 ? [...girlCandidates] : [...GIRLS_ROOM_NUMBERS];
  const girlRoom = girlPool[Math.floor(Math.random() * girlPool.length)];

  const remainingRooms = [1, 2, 3, 4, 5, 6].filter((n) => n !== girlRoom);
  for (let i = remainingRooms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingRooms[i], remainingRooms[j]] = [
      remainingRooms[j],
      remainingRooms[i],
    ];
  }

  const otherKeys: TaskKey[] = ["cuisine", "sdb2", "espace", "poubelles"];
  const prevByRoom = new Map<number, TaskKey>();
  for (const a of previous ?? []) {
    if (a.taskKey === "sdb1" || a.taskKey === "wc1") continue;
    prevByRoom.set(a.roomNumber, a.taskKey);
  }

  let best: { roomNumber: number; taskKey: TaskKey }[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const roomsForOthers = remainingRooms.slice(0, 4);

  function permute<T>(items: T[]): T[][] {
    if (items.length <= 1) return [items];
    const out: T[][] = [];
    for (let i = 0; i < items.length; i++) {
      const rest = [...items.slice(0, i), ...items.slice(i + 1)];
      for (const p of permute(rest)) out.push([items[i], ...p]);
    }
    return out;
  }

  for (const perm of permute(otherKeys)) {
    let score = 0;
    const pairs = roomsForOthers.map((roomNumber, i) => ({
      roomNumber,
      taskKey: perm[i],
    }));
    for (const p of pairs) {
      if (prevByRoom.get(p.roomNumber) === p.taskKey) score += 10;
    }
    if (score < bestScore) {
      bestScore = score;
      best = pairs;
      if (score === 0) break;
    }
  }

  return [
    { taskKey: "sdb1", roomNumber: girlRoom },
    { taskKey: "wc1", roomNumber: girlRoom },
    ...(best ?? []).map((p) => ({
      taskKey: p.taskKey,
      roomNumber: p.roomNumber,
    })),
  ];
}

/** 0 = semaine 1 du cycle ancré sur anchorWeekStart (lundi semaine 1, date locale). */
export function cycleWeekIndexFromAnchor(
  weekStart: Date,
  anchorWeekStart: Date,
): number {
  return differenceInCalendarWeeks(
    startOfDay(weekStart),
    startOfDay(anchorWeekStart),
    { weekStartsOn: 1 },
  );
}
