import "server-only";

export const BACKEND_API_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export const BACKEND_TIMEOUT_MS = 8000;
