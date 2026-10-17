import { NextResponse } from "next/server";
import { getTasksSummaryFromBackend } from "@/lib/server/backendApi";
import { errorResponse, toErrorResponse } from "@/lib/server/routeHandlers";

export const dynamic = "force-dynamic";

const MAX_WINDOW_DAYS = 365;

function parseWindowDays(value: string | null) {
  if (value === null) {
    return undefined;
  }

  const days = Number(value);
  return Number.isInteger(days) && days >= 1 && days <= MAX_WINDOW_DAYS ? days : null;
}

export async function GET(request: Request) {
  const windowDays = parseWindowDays(new URL(request.url).searchParams.get("days"));
  if (windowDays === null) {
    return errorResponse(400, `days must be an integer between 1 and ${MAX_WINDOW_DAYS}`);
  }

  try {
    const summary = await getTasksSummaryFromBackend(windowDays);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Unable to fetch the tasks summary.");
  }
}
