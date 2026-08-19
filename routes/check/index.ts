import { define } from "@/lib/fresh.ts";
import { getUrlForFlow, kratosBrowserUrl } from "@/lib/index.ts";
import { frontend } from "@/lib/sdk/index.ts";
import { getUserFullName } from "@/lib/user.ts";
import type { Context } from "fresh";
import type { Identity, Session } from "@ory/client-fetch";
import { ResponseError } from "@ory/client-fetch";
import type { State } from "@/lib/fresh.ts";

export function checkHandler(returnPath: (ctx: Context<State>) => string) {
  return define.handlers({
    GET: (ctx) => check(ctx, returnPath(ctx)),
    HEAD: (ctx) => check(ctx, returnPath(ctx)),
  });
}

async function check(
  ctx: Context<State>,
  returnPath: string,
): Promise<Response> {
  try {
    const session = await frontend.toSession({
      cookie: ctx.req.headers.get("cookie") ?? "",
    });
    return allow(session);
  } catch (err) {
    if (
      err instanceof ResponseError && [401, 403].includes(err.response.status)
    ) {
      const params = new URLSearchParams({
        return_to: ctx.req.headers.has("x-envoy-original-uri")
          ? ctx.req.headers.get("x-envoy-original-uri")!
          : "https://" + ctx.req.headers.get("host") + returnPath +
            ctx.url.search,
      });
      if (err.response.status === 403) params.set("aal", "aal2");
      return new Response(null, {
        status: 302,
        headers: {
          location: getUrlForFlow(kratosBrowserUrl, "login", params),
        },
      });
    }
    console.error("auth check: unexpected error from Kratos", err);
    return new Response(null, { status: 500 });
  }
}

function allow(session: Session): Response {
  const headers = new Headers();
  const identity = session.identity;
  if (identity) {
    headers.set("X-User-Id", identity.id);

    const name = getUserFullName(identity);
    headers.set("X-User-Name", name);

    const email = getIdentityEmail(identity);
    if (email) {
      headers.set("X-User-Email", email);
    }
  }
  return new Response(null, { status: 200, headers });
}

function getIdentityEmail(identity: Identity): string | undefined {
  return (
    identity.verifiable_addresses?.[0]?.value ??
      ((identity.traits as Record<string, unknown> | undefined)?.email as
        | string
        | undefined)
  );
}

export const handler = checkHandler((ctx) => "/");
