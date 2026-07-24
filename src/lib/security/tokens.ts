import { randomBytes } from "crypto";

/** Token QR long, non prédictible (64 caractères hex). */
export function generateQrToken(): string {
  return randomBytes(32).toString("hex");
}

/** Slug d'URL pour une chambre : chambre-4 */
export function roomSlug(number: number): string {
  return `chambre-${number}`;
}

/** Parse "chambre-4" → 4, ou null si invalide. */
export function parseRoomSlug(slug: string): number | null {
  const match = /^chambre-(\d+)$/i.exec(slug);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}
