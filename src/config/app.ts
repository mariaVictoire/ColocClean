/**
 * Configuration centrale de l'application.
 * Pour renommer l'app plus tard : modifier APP_NAME / APP_SLUG ici uniquement.
 */
export const appConfig = {
  /** Nom affiché (UI, emails, métadonnées) */
  name: "ColocClean",
  /** Identifiant technique (cookies, clés, préfixes) */
  slug: "coloclean",
  /** Description courte */
  description:
    "Gestion automatique de la rotation du ménage en colocation.",
  /** URL de base des pages publiques locataires */
  publicRoomPathPrefix: "/app/chambre",
  /** Locale / fuseau par défaut */
  defaults: {
    timezone: "Europe/Paris",
    language: "fr",
    primaryColor: "#0F766E",
    roomCount: 6,
    deadlineTime: "18:00",
    generationDay: 1, // lundi
    reminderDay: 5, // vendredi
    deadlineDay: 0, // dimanche
  },
} as const;

export type AppConfig = typeof appConfig;
