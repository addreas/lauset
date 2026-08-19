import { UserErrorCard } from "@ory/elements-preact";
import type { FlowError } from "@ory/client";
import { ResponseError } from "@ory/client-fetch";
import { HttpError } from "fresh";

/** Back URL for error cards: where the user came from, or "/". */
export function backUrlFromReq(req: Request): string {
  return req.headers.get("Referer") || "/";
}

/**
 * Serialize an error for the `debug` field of a FlowError. Handles Ory
 * ResponseError, Fresh HttpError, and generic Errors.
 */
export async function formatError(err: unknown): Promise<unknown> {
  if (err instanceof ResponseError) {
    let body: unknown;
    try {
      body = await err.response.clone().json();
    } catch {
      try {
        body = await err.response.clone().text();
      } catch {
        body = undefined;
      }
    }
    return {
      name: err.name,
      message: err.message,
      response: { status: err.response.status, url: err.response.url, body },
    };
  }
  if (err instanceof HttpError) {
    return { status: err.status, message: err.message };
  }
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return String(err);
}

/** FlowError for an HTTP error with the given status and message. */
export function httpError(status: number, message: string): FlowError {
  return {
    id: String(status),
    error: { code: status, message },
  } as FlowError;
}

/** FlowError for an unhandled internal server error. */
export async function internalServerError(err: unknown): Promise<FlowError> {
  return {
    id: "internal_server_error",
    error: {
      code: 500,
      status: "Internal Server Error",
      message: "An internal server error occurred. Please try again later.",
      debug: JSON.parse(JSON.stringify(await formatError(err))),
    },
  } as FlowError;
}

/** Shared error card wrapping Ory's UserErrorCard. */
export function ErrorCard({
  error,
  backUrl,
  title,
}: {
  error: FlowError;
  backUrl?: string;
  title?: string;
}) {
  return <UserErrorCard title={title} error={error} backUrl={backUrl ?? "/"} />;
}
