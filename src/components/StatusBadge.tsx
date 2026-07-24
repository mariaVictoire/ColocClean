import type { AssignmentStatus } from "@prisma/client";
import { ASSIGNMENT_STATUS_LABELS } from "@/lib/constants/status";

const STYLES: Record<AssignmentStatus, string> = {
  UPCOMING: "bg-blue-50 text-blue-800 border-blue-200",
  PENDING: "bg-orange-50 text-orange-800 border-orange-200",
  COMPLETED: "bg-green-50 text-green-800 border-green-200",
  LATE: "bg-red-50 text-red-800 border-red-200",
  EXCUSED: "bg-stone-100 text-stone-700 border-stone-200",
  CANCELLED: "bg-stone-100 text-stone-500 border-stone-200",
};

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {ASSIGNMENT_STATUS_LABELS[status]}
    </span>
  );
}
