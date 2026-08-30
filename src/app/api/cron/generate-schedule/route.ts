import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  closePastActiveSchedules,
  generateCurrentWeekSchedule,
} from "@/lib/scheduling/schedule";

/**
 * Cron Vercel : chaque lundi (voir vercel.json).
 * Génère le planning de la semaine en cours pour toutes les colocations.
 */
function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  // Vercel Cron envoie Authorization: Bearer $CRON_SECRET
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const closedPast = await closePastActiveSchedules();

  const properties = await prisma.property.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  const results: {
    propertyId: string;
    name: string;
    created: boolean;
    scheduleId: string;
    error?: string;
  }[] = [];

  for (const p of properties) {
    try {
      const result = await generateCurrentWeekSchedule(p.id);
      results.push({
        propertyId: p.id,
        name: p.name,
        created: result.created,
        scheduleId: result.schedule.id,
      });
    } catch (error) {
      results.push({
        propertyId: p.id,
        name: p.name,
        created: false,
        scheduleId: "",
        error: error instanceof Error ? error.message : "Erreur",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    closedPast,
    generated: results.filter((r) => r.created).length,
    existing: results.filter((r) => !r.created && !r.error).length,
    failed: results.filter((r) => r.error).length,
    results,
  });
}
