export type RoomRef = { id: string; number: number };
export type TaskRef = { id: string; difficulty: number | null };

export type PreviousAssignment = {
  roomId: string;
  taskId: string;
};

export type RotationResult = {
  roomId: string;
  taskId: string;
}[];

function permute<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const results: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permute(rest)) {
      results.push([items[i], ...p]);
    }
  }
  return results;
}

function scorePermutation(
  sortedRooms: RoomRef[],
  perm: TaskRef[],
  prevByRoom: Map<string, string>,
  mean: number,
): { result: RotationResult; score: number; hasRepeat: boolean } {
  let score = 0;
  let hasRepeat = false;
  const result: RotationResult = [];

  for (let i = 0; i < sortedRooms.length; i++) {
    const room = sortedRooms[i];
    const task = perm[i];
    result.push({ roomId: room.id, taskId: task.id });

    if (prevByRoom.get(room.id) === task.id) {
      score += 10_000;
      hasRepeat = true;
    }
    score += Math.abs((task.difficulty ?? 3) - mean);
  }

  return { result, score, hasRepeat };
}

/**
 * Rotation équilibrée + tirage aléatoire parmi les bonnes solutions :
 * - 1 tâche / chambre, 1 chambre / tâche
 * - évite la même tâche deux semaines de suite si possible
 * - à chaque génération / régénération, le mapping change (random)
 */
export function generateBalancedRotation(
  rooms: RoomRef[],
  tasks: TaskRef[],
  previous: PreviousAssignment[],
): RotationResult {
  if (rooms.length === 0 || tasks.length === 0) {
    throw new Error("Au moins une chambre et une tâche sont requises.");
  }
  if (rooms.length !== tasks.length) {
    throw new Error(
      `Nombre de chambres (${rooms.length}) ≠ tâches actives (${tasks.length}).`,
    );
  }

  const sortedRooms = [...rooms].sort((a, b) => a.number - b.number);
  const prevByRoom = new Map(previous.map((p) => [p.roomId, p.taskId]));
  const difficulties = tasks.map((t) => t.difficulty ?? 3);
  const mean =
    difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;

  const scored = permute(tasks).map((perm) =>
    scorePermutation(sortedRooms, perm, prevByRoom, mean),
  );

  const withoutRepeat = scored.filter((s) => !s.hasRepeat);
  const pool = withoutRepeat.length > 0 ? withoutRepeat : scored;

  const bestScore = Math.min(...pool.map((s) => s.score));
  // Garde les solutions proches du meilleur score pour rester équilibré,
  // tout en permettant plusieurs variantes.
  const margin = Math.max(1, mean * 0.5);
  const top = pool.filter((s) => s.score <= bestScore + margin);
  const candidates = top.length > 0 ? top : pool;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  if (!pick) {
    throw new Error("Impossible de générer une rotation.");
  }
  return pick.result;
}
