import { ZodError } from "zod";

type ApiErrorBody = {
  error: string;
  details?: unknown;
};

export function jsonResponse<T>(body: T, status = 200): Response {
  return Response.json(body, { status });
}

export function jsonError(message: string, status = 400, details?: unknown): Response {
  const payload: ApiErrorBody = details ? { error: message, details } : { error: message };
  return Response.json(payload, { status });
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function normalizeError(error: unknown): Response {
  if (error instanceof ZodError) {
    return jsonError("Validation failed", 422, error.flatten());
  }
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return jsonError("Authentication required", 401);
    if (error.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (error.message === "INVALID_JSON") return jsonError("Invalid JSON body", 400);
    if (error.message === "INSUFFICIENT_STOCK") return jsonError("One or more items are out of stock", 409);
    if (error.message === "CART_EMPTY") return jsonError("Cart is empty", 400);
    if (error.message === "ADDRESS_NOT_FOUND") return jsonError("Address not found", 404);
    return jsonError(error.message, 400);
  }

  return jsonError("Unexpected server error", 500);
}

