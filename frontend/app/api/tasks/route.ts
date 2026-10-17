import { NextResponse } from "next/server";
import { getTasksFromBackend } from "@/lib/server/backendApi";
import { toErrorResponse } from "@/lib/server/routeHandlers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tasks = await getTasksFromBackend();
    return NextResponse.json({ data: tasks }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Unable to fetch tasks.");
  }
}
