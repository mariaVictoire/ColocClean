import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateNextWeekIfNeeded } from "@/lib/scheduling/schedule";

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const properties = await prisma.property.findMany({ select: { id: true } });
  const results = [];
  for (const p of properties) {
    const result = await generateNextWeekIfNeeded(p.id);
    results.push({
      propertyId: p.id,
      created: result.created,
      scheduleId: result.schedule.id,
    });
  }

  return NextResponse.json({ ok: true, results });
}
