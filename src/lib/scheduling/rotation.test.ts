import { describe, expect, it } from "vitest";
import { generateBalancedRotation } from "@/lib/scheduling/rotation";

describe("generateBalancedRotation", () => {
  const rooms = [1, 2, 3, 4, 5, 6].map((n) => ({
    id: `r${n}`,
    number: n,
  }));
  const tasks = [1, 2, 3, 4, 5, 6].map((n) => ({
    id: `t${n}`,
    difficulty: n,
  }));

  it("assigne une tâche unique par chambre", () => {
    const result = generateBalancedRotation(rooms, tasks, []);
    expect(result).toHaveLength(6);
    expect(new Set(result.map((r) => r.roomId)).size).toBe(6);
    expect(new Set(result.map((r) => r.taskId)).size).toBe(6);
  });

  it("évite la même tâche deux semaines de suite si possible", () => {
    const previous = rooms.map((r, i) => ({
      roomId: r.id,
      taskId: tasks[i].id,
    }));
    const result = generateBalancedRotation(rooms, tasks, previous);
    for (const pair of result) {
      const prev = previous.find((p) => p.roomId === pair.roomId)!;
      expect(pair.taskId).not.toBe(prev.taskId);
    }
  });

  it("refuse un nombre de chambres ≠ tâches", () => {
    expect(() =>
      generateBalancedRotation(rooms, tasks.slice(0, 5), []),
    ).toThrow(/Nombre de chambres/);
  });
});
