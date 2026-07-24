import { describe, expect, it } from "vitest";
import { parseRoomSlug, roomSlug } from "@/lib/security/tokens";

describe("roomSlug helpers", () => {
  it("construit un slug de chambre", () => {
    expect(roomSlug(4)).toBe("chambre-4");
  });

  it("parse un slug valide", () => {
    expect(parseRoomSlug("chambre-4")).toBe(4);
  });

  it("rejette un slug invalide", () => {
    expect(parseRoomSlug("room-4")).toBeNull();
    expect(parseRoomSlug("chambre-0")).toBeNull();
  });
});
