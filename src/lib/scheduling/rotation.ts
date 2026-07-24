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

/**
 * Rotation équilibrée :
 * - 1 tâche / chambre, 1 chambre / tâche
 * - évite la même tâche deux semaines de suite si possible
 * - équilibre la difficulté (somme des écarts au moyen)
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

  const taskPerms = permute(tasks);
  let best: RotationResult | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const perm of taskPerms) {
    let score = 0;
    const result: RotationResult = [];

    for (let i = 0; i < sortedRooms.length; i++) {
      const room = sortedRooms[i];
      const task = perm[i];
      result.push({ roomId: room.id, taskId: task.id });

      if (prevByRoom.get(room.id) === task.id) {
        score += 10_000;
      }
      score += Math.abs((task.difficulty ?? 3) - mean);
    }

    // Léger biais : chambres à numéro bas → tâches un peu plus difficiles
    // pour éviter toujours le même pattern numérique.
    for (let i = 0; i < result.length; i++) {
      score += i * 0.01 * ((perm[i].difficulty ?? 3) % 2);
    }

    if (score < bestScore) {
      bestScore = score;
      best = result;
      if (score < 10_000) {
        // Déjà une solution sans répétition : on peut s'arrêter tôt
        // seulement si score quasi optimal
        if (score < mean) break;
      }
    }
  }

  if (!best) {
    throw new Error("Impossible de générer une rotation.");
  }
  return best;
}
