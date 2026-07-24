// Algorithme de rotation équilibrée — implémenté en Phase 3
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

/**
 * Placeholders pour Phase 3 :
 * - 1 tâche / chambre / semaine
 * - 1 chambre / tâche
 * - éviter la même tâche deux semaines de suite
 * - rotation complète avant recommencer
 * - équilibrer les difficultés
 */
export function generateBalancedRotation(
  _rooms: RoomRef[],
  _tasks: TaskRef[],
  _previous: PreviousAssignment[],
): RotationResult {
  throw new Error("generateBalancedRotation sera implémenté en Phase 3");
}
