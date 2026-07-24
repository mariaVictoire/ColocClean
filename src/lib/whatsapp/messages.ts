import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ReminderType } from "@prisma/client";

export type MessageContext = {
  numero_chambre: number | string;
  nom_tache: string;
  date_limite: Date | string;
  /** Lien court pour valider (ex. https://…/q/token) */
  lien_validation?: string;
};

export function formatDeadline(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });
}

export function fillWhatsAppTemplate(
  template: string,
  ctx: MessageContext,
): string {
  return template
    .replaceAll("{numero_chambre}", String(ctx.numero_chambre))
    .replaceAll("{nom_tache}", ctx.nom_tache)
    .replaceAll(
      "{date_limite}",
      typeof ctx.date_limite === "string"
        ? ctx.date_limite
        : formatDeadline(ctx.date_limite),
    )
    .replaceAll("{lien_validation}", ctx.lien_validation ?? "");
}

/** Normalise un numéro FR/international vers digits pour wa.me */
export function toWhatsAppDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0") && digits.length === 10) {
    return `33${digits.slice(1)}`;
  }
  return digits;
}

export function whatsappDeepLink(phone: string, message: string): string | null {
  const digits = toWhatsAppDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function templateForType(
  type: ReminderType,
  property: {
    whatsappFridayMessage: string;
    whatsappFriendlyMessage: string;
    whatsappLateMessage: string;
  },
): string {
  switch (type) {
    case "FRIDAY":
      return property.whatsappFridayMessage;
    case "FRIENDLY":
      return property.whatsappFriendlyMessage;
    case "LATE":
      return property.whatsappLateMessage;
    case "CUSTOM":
      return property.whatsappFriendlyMessage;
    default:
      return property.whatsappFridayMessage;
  }
}

/** Chemin court de validation : /q/<token> */
export function shortValidationPath(qrToken: string): string {
  return `/q/${qrToken}`;
}
