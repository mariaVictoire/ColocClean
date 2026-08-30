import { AssignmentStatus } from "@prisma/client";

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  UPCOMING: "À venir",
  PENDING: "En attente",
  COMPLETED: "Terminé",
  LATE: "En retard",
  EXCUSED: "Exempté",
  CANCELLED: "Annulé",
};

export const ASSIGNMENT_STATUS_COLORS: Record<AssignmentStatus, string> = {
  UPCOMING: "blue",
  PENDING: "orange",
  COMPLETED: "green",
  LATE: "red",
  EXCUSED: "gray",
  CANCELLED: "gray",
};
