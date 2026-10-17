import { NextResponse } from "next/server";
import { updateTaskInBackend } from "@/lib/server/backendApi";
import { errorResponse, toErrorResponse } from "@/lib/server/routeHandlers";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "Request body must be valid JSON.");
  }

  const completed = (payload as { completed?: unknown } | null)?.completed;
  if (typeof completed !== "boolean") {
    return errorResponse(400, "completed must be boolean");
  }

  try {
    const task = await updateTaskInBackend(params.id, completed);
    return NextResponse.json({ data: task }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Unable to update task.");
  }
}
