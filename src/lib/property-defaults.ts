import { randomBytes } from "crypto";

export const DEFAULT_WHATSAPP_TEMPLATES = {
  friday: `Bonjour,

Locataire de la Chambre {numero_chambre}, rappel : ce week-end vous êtes chargé du nettoyage de : {nom_tache}.

Merci d'effectuer cette tâche avant le {date_limite}, puis de la valider :
- en scannant le QR code de votre chambre, ou
- via ce lien si vous ne pouvez pas scanner : {lien_validation}

Merci.`,
  friendly: `Bonjour,

Locataire de la Chambre {numero_chambre}, rappel : ce week-end vous êtes chargé du nettoyage de : {nom_tache}.

Merci d'effectuer cette tâche avant le {date_limite}, puis de la valider :
- en scannant le QR code de votre chambre, ou
- via ce lien si vous ne pouvez pas scanner : {lien_validation}

Merci.`,
  late: `Bonjour,

Signalement retard : le nettoyage de {nom_tache}, attribué à la Chambre {numero_chambre}, n'a pas encore été validé.

Merci de régulariser et de valider la tâche :
- via le QR code de votre chambre, ou
- via ce lien : {lien_validation}`,
} as const;

export type TaskDef = {
  name: string;
  description: string;
  difficulty: number;
  checklist: string[];
};

/** Tâches cycle papier Arnold (SDB1+WC1 filles, espace, poubelles). */
export const PAPER_TASK_DEFS: TaskDef[] = [
  {
    name: "Cuisine",
    description: "Nettoyage complet de la cuisine commune.",
    difficulty: 4,
    checklist: [
      "Nettoyer le plan de travail",
      "Nettoyer l'évier",
      "Nettoyer le sol",
      "Vider / nettoyer la poubelle de cuisine",
      "Nettoyer le micro-ondes",
      "Nettoyer le four",
    ],
  },
  {
    name: "Salle de bain 1",
    description:
      "Salle de bain 1 (filles) : lavabo, douche, miroir et sol. Associée au WC 1.",
    difficulty: 4,
    checklist: [
      "Nettoyer le lavabo",
      "Nettoyer la douche",
      "Nettoyer le miroir",
      "Nettoyer le sol",
    ],
  },
  {
    name: "Salle de bain 2",
    description: "Salle de bain 2 : lavabo, douche, miroir et sol.",
    difficulty: 4,
    checklist: [
      "Nettoyer le lavabo",
      "Nettoyer la douche",
      "Nettoyer le miroir",
      "Nettoyer le sol",
    ],
  },
  {
    name: "WC 1",
    description:
      "WC 1 (filles) : cuvette, lavabo, sol et miroir. Associé à la salle de bain 1.",
    difficulty: 3,
    checklist: [
      "Nettoyer la cuvette",
      "Nettoyer le lavabo",
      "Nettoyer le sol",
      "Nettoyer le miroir",
    ],
  },
  {
    name: "Espace commun",
    description:
      "Couloir, escalier et entrée : aspirateur, serpillère, dépoussiérage.",
    difficulty: 3,
    checklist: [
      "Passer l'aspirateur",
      "Passer la serpillère",
      "Dépoussiérer les surfaces",
      "Remettre l'espace en ordre",
    ],
  },
  {
    name: "Poubelles",
    description: "Vider les poubelles dès que possible.",
    difficulty: 2,
    checklist: [
      "Vider les poubelles communes",
      "Sortir les sacs",
      "Remplacer les sacs",
      "Vérifier qu'aucun sac ne reste dans les parties communes",
    ],
  },
];

/**
 * Espaces communs type Ralph :
 * 2 SDB (dont 1 avec WC), 1 WC indépendant, cuisine, balcon, couloir.
 * → 6 tâches, 1 par chambre chaque semaine.
 */
export const BALANCED_TASK_DEFS: TaskDef[] = [
  {
    name: "Cuisine",
    description: "Nettoyage complet de la cuisine commune.",
    difficulty: 4,
    checklist: [
      "Nettoyer le plan de travail",
      "Nettoyer l'évier",
      "Nettoyer le sol",
      "Vider / nettoyer la poubelle de cuisine",
      "Nettoyer le micro-ondes",
      "Nettoyer le four",
    ],
  },
  {
    name: "Salle de bain 1 (avec WC)",
    description: "Salle de bain avec WC : lavabo, douche, WC, miroir et sol.",
    difficulty: 4,
    checklist: [
      "Nettoyer le lavabo",
      "Nettoyer la douche",
      "Nettoyer le WC",
      "Nettoyer le miroir",
      "Nettoyer le sol",
    ],
  },
  {
    name: "Salle de bain 2",
    description: "Salle de bain : lavabo, douche, miroir et sol.",
    difficulty: 4,
    checklist: [
      "Nettoyer le lavabo",
      "Nettoyer la douche",
      "Nettoyer le miroir",
      "Nettoyer le sol",
    ],
  },
  {
    name: "WC indépendant",
    description: "WC séparé : cuvette, sol et surfaces.",
    difficulty: 3,
    checklist: [
      "Nettoyer la cuvette",
      "Nettoyer le sol",
      "Nettoyer les surfaces / miroir",
      "Vérifier le papier toilette",
    ],
  },
  {
    name: "Balcon",
    description: "Balcon commun : balayage, nettoyage et rangement.",
    difficulty: 2,
    checklist: [
      "Balayer le balcon",
      "Nettoyer les surfaces",
      "Ranger les objets / plantes",
      "Vider le cendrier / déchets",
    ],
  },
  {
    name: "Couloir",
    description: "Couloir et passages : aspirateur, serpillère, dépoussiérage.",
    difficulty: 3,
    checklist: [
      "Passer l'aspirateur",
      "Passer la serpillère",
      "Dépoussiérer les surfaces",
      "Remettre le passage en ordre",
    ],
  },
];

/** Alias historique = tâches papier Arnold */
export const DEFAULT_TASK_DEFS = PAPER_TASK_DEFS;

export function createQrToken(): string {
  return randomBytes(32).toString("hex");
}
