import { describe, expect, it } from "vitest";
import {
  FIXED_CYCLE_BY_TASK,
  generateRandomCycleAssignments,
  getFixedCycleAssignments,
  GIRLS_ROOM_NUMBERS,
} from "@/lib/scheduling/fixed-cycle";

describe("fixed cycle", () => {
  it("expose 6 semaines pour chaque tâche", () => {
    for (const rooms of Object.values(FIXED_CYCLE_BY_TASK)) {
      expect(rooms).toHaveLength(6);
    }
  });

  it("semaine 2 = attributions papier", () => {
    const week2 = getFixedCycleAssignments(1);
    expect(week2).toEqual([
      { taskKey: "cuisine", roomNumber: 5 },
      { taskKey: "sdb1", roomNumber: 4 },
      { taskKey: "sdb2", roomNumber: 6 },
      { taskKey: "wc1", roomNumber: 4 },
      { taskKey: "espace", roomNumber: 2 },
      { taskKey: "poubelles", roomNumber: 2 },
    ]);
  });

  it("sdb1 et wc1 restent sur chambres filles", () => {
    for (let w = 0; w < 6; w++) {
      const pairs = getFixedCycleAssignments(w);
      const sdb1 = pairs.find((p) => p.taskKey === "sdb1")!;
      const wc1 = pairs.find((p) => p.taskKey === "wc1")!;
      expect(GIRLS_ROOM_NUMBERS).toContain(sdb1.roomNumber);
      expect(wc1.roomNumber).toBe(sdb1.roomNumber);
    }
  });

  it("aléatoire : filles sur 1/3/4 et sdb1=wc1", () => {
    for (let i = 0; i < 20; i++) {
      const pairs = generateRandomCycleAssignments();
      const sdb1 = pairs.find((p) => p.taskKey === "sdb1")!;
      const wc1 = pairs.find((p) => p.taskKey === "wc1")!;
      expect(GIRLS_ROOM_NUMBERS).toContain(sdb1.roomNumber);
      expect(wc1.roomNumber).toBe(sdb1.roomNumber);
      expect(pairs).toHaveLength(6);
    }
  });
});
