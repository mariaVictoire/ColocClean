import { NextResponse } from "next/server";
import { markLateAssignments } from "@/lib/scheduling/schedule";

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

  const updated = await markLateAssignments();
  return NextResponse.json({ ok: true, updated });
}
