import { define } from "@/lib/fresh.ts";
import { page } from "fresh";
import { isQuerySet } from "@/lib/index.ts";
import type { FlowError, GenericError } from "@ory/client";
import { ResponseError } from "@ory/client-fetch";
import { UserErrorCard } from "@ory/elements-preact";
import { frontend } from "@/lib/sdk/index.ts";
import { toFlowError } from "@/lib/ory-types.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/error.ts
type OAuth2Error = {
  error: string;
  error_description?: string;
  error_hint?: string;
};

function isOAuth2Error(query: Record<string, string>): query is OAuth2Error {
  return query.error !== undefined;
}

/**
 * Returns an error object, either from Ory Identities or an OAuth2 error.
 *
 * @param query the query parameters as received from the request
 * @returns a FlowError object
 */
async function fetchError(query: Record<string, string>): Promise<FlowError> {
  // If the error is an OAuth2 error, its details are encoded into the URL.
  // We can simply decode them and return them here.
  if (isOAuth2Error(query)) {
    return {
      id: decodeURIComponent(query.error.toString()),
      error: {
        status: "OAuth2 Error",
        id: decodeURIComponent(query.error.toString()),
        message: decodeURIComponent(
          query.error_description?.toString() || "No description provided",
        ),
        ...(query.error_hint
          ? { hint: decodeURIComponent(query.error_hint.toString()) }
          : {}),
        code: 599, // Dummy code to trigger the full error screen
      },
    };
  } else if (isQuerySet(query.id)) {
    // If the error comes from Ory Identities/Kratos, we need to fetch its
    // details from the backend. Once that's done, we can return the error.
    const res = await frontend.getFlowErrorRaw({ id: query.id });

    if (res.raw.status !== 200) {
      throw new Error("No error was found");
    }

    return toFlowError(await res.value());
  }

  throw new Error("No error was found");
}

export const handler = define.handlers({
  async GET(ctx) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const backUrl = ctx.req.headers.get("Referer") || "/";

    let error: FlowError;
    let title: string | undefined;
    try {
      error = await fetchError(params);
    } catch (err) {
      // Surface the real error from a failed Kratos/Ory response; fall back to
      // the thrown error's message for anything else. Force a 500 status.
      let inner: GenericError;
      if (err instanceof ResponseError) {
        inner = (await err.response.clone().json()).error;
      } else {
        inner = { message: err instanceof Error ? err.message : String(err) };
      }
      error = {
        id: "Failed to fetch error details",
        error: { ...inner, code: 500 },
      } as FlowError;
      title = "An error occurred";
    }

    return page({ error, backUrl, title });
  },
});

export default define.page<typeof handler>(({ data }) => (
  <UserErrorCard error={data.error} backUrl={data.backUrl} title={data.title} />
));
