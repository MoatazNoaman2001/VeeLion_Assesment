import "server-only";

import { NextResponse } from "next/server";
import { BackendError } from "@/lib/server/backendApi";

export function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status });
}

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof BackendError) {
    return errorResponse(error.status, error.message);
  }

  console.error(error);
  return errorResponse(500, fallbackMessage);
}
