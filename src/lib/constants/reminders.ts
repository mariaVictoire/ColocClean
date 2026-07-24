import type { ReminderType } from "@prisma/client";

/** Libellés UI — seuls Rappel et Signalement retard sont exposés. */
export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  FRIDAY: "Rappel",
  LATE: "Signalement retard",
  FRIENDLY: "Rappel",
  CUSTOM: "Rappel",
};

/** Types proposés dans l’écran WhatsApp. */
export const WHATSAPP_REMINDER_OPTIONS: ReminderType[] = ["FRIDAY", "LATE"];
