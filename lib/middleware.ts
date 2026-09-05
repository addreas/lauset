// Copyright © 2022 Ory Corp
// SPDX-License-Identifier: Apache-2.0
import type { Context } from "fresh";
import { HttpError } from "fresh";
import { frontend } from "@/lib/sdk/index.ts";
import { getUrlForFlow, isUUID, kratosBrowserUrl } from "./index.ts";
import type { ResponseError, Session } from "@ory/client-fetch";
import { define, type State } from "@/lib/fresh.ts";

/**
 * Checks the error returned by toSession() and initiates a 2FA flow if necessary
 * or returns null.
 *
 * In the Express reference this returns a boolean and relies on `res.redirect`
 * being a side effect. Fresh's `ctx.redirect()` is pure — it returns a
 * `Response` — so this returns that `Response` (or `null`) for the caller to
 * return from the middleware.
 *
 * @internal
 * @param ctx
 */
const maybeInitiate2FA =
  (ctx: Context<State>) => (err: ResponseError): Response | null => {
    // 403 on toSession means that we need to request 2FA
    if (err.response && err.response.status === 403) {
      const return_to = ctx.req.headers.get("x-original-uri") ??
        (ctx.url.pathname + ctx.url.search);
      return ctx.redirect(
        getUrlForFlow(
          kratosBrowserUrl,
          "login",
          new URLSearchParams({
            aal: "aal2",
            return_to,
          }),
        ),
      );
    }
    return null;
  };

export const handleCsrfError = define.middleware(async (ctx) => {
  try {
    return await ctx.next();
  } catch (err) {
    if (err instanceof HttpError && err.status === 403) {
      return new Response(
        "<h1>A security violation was detected, please fill out the form again.</h1>",
        {
          status: 403,
          headers: { "Content-Type": "text/html" },
        },
      );
    }
    throw err;
  }
});

/**
 * Adds the session to the request context.
 */
const addSessionToRequest = (ctx: Context<State>) => (session: Session) => {
  ctx.state.session = session;
};

/**
 * This middleware requires that the HTTP request has a session.
 * If the session is not present, it will redirect to the login flow.
 *
 * If a session is set but 403 is returned, a 2FA flow will be initiated.
 */
export const requireAuth = define.middleware((ctx) => {
  // when accessing settings with a valid flow id
  // we allow the settings page to trigger the
  // login flow on session_aal2_required
  const query = Object.fromEntries(ctx.url.searchParams);
  if (ctx.req.url.includes("/settings") && query.flow) {
    if (isUUID.test(query.flow)) {
      return setSession(ctx);
    }
  }
  return frontend
    .toSession({ cookie: ctx.req.headers.get("cookie") ?? "" })
    .then(addSessionToRequest(ctx))
    .catch((err) => {
      return (
        maybeInitiate2FA(ctx)(err) ??
          ctx.redirect(getUrlForFlow(kratosBrowserUrl, "login"))
      );
    })
    .then((result) => result ?? ctx.next());
});

/**
 * Sets the session in the request. If no session is found,
 * the request still succeeds.
 *
 * If a session is set but 403 is returned, a 2FA flow will be initiated.
 */
export const setSession = define.middleware((ctx) =>
  frontend
    .toSession({ cookie: ctx.req.headers.get("cookie") ?? "" })
    .then(addSessionToRequest(ctx))
    .catch((err) => maybeInitiate2FA(ctx)(err))
    .then((result) => result ?? ctx.next())
);

/**
 * This middleware requires that the HTTP request has no session.
 * If the session is present, it will redirect to the home page.
 */
export const requireNoAuth = define.middleware((ctx) =>
  frontend
    .toSession({
      cookie: ctx.req.headers.get("cookie") ?? "",
    })
    .then(() => ctx.redirect("/"))
    .catch(() => ctx.next())
);
