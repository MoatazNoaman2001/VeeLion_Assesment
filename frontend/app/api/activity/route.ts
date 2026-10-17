import { NextResponse } from "next/server";
import { getActivityFromBackend } from "@/lib/server/backendApi";
import { toErrorResponse } from "@/lib/server/routeHandlers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await getActivityFromBackend();
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Unable to fetch activity logs.");
  }
}
