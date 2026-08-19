// Copyright © 2022 Ory Corp
// SPDX-License-Identifier: Apache-2.0
//
// pkg — shared helpers for talking to Ory Kratos / Hydra. This is the single
// source of truth for flow-URL builders, consent helpers and the soft-error
// redirector. Routes and middleware both import from here.
import { apiBaseUrl } from "./sdk/index.ts";
import { isSessionAal2Required, ResponseError } from "@ory/client-fetch";
import type {
  OAuth2ConsentRequest,
  OAuth2LogoutRequest,
} from "@ory/client-fetch";
import type { Context } from "fresh";
import type { State } from "@/lib/fresh.ts";

export const kratosBrowserUrl = apiBaseUrl;

export const removeTrailingSlash = (s: string) => s.replace(/\/$/, "");

export const getUrlForFlow = (
  base: string,
  flow: string,
  query?: URLSearchParams,
) =>
  `${removeTrailingSlash(base)}/self-service/${flow}/browser${
    query ? `?${query.toString()}` : ""
  }`;

export const isOAuthConsentRouteEnabled = () =>
  Boolean(Deno.env.get("HYDRA_ADMIN_URL") || Deno.env.get("ORY_SDK_URL"));

export const shouldSkipConsent = (challenge: OAuth2ConsentRequest) => {
  let trustedClients: string[] = [];
  const trusted = Deno.env.get("TRUSTED_CLIENT_IDS");
  if (trusted) {
    trustedClients = trusted.split(",");
  }
  return challenge.skip ||
      challenge.client?.skip_consent ||
      (challenge.client?.client_id &&
        trustedClients.indexOf(challenge.client?.client_id) > -1)
    ? true
    : false;
};

export const shouldSkipLogoutConsent = (challenge: OAuth2LogoutRequest) =>
  Boolean(
    (
      challenge.client as OAuth2LogoutRequest & {
        skip_logout_consent: boolean;
      }
    )?.skip_logout_consent,
  );

export const isUUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const isQuerySet = (x: unknown): x is string =>
  typeof x === "string" && x.length > 0;

// Redirects to the specified URL if the error is a 404, 410 or 403 error code.
export function redirectOnSoftError(ctx: Context<State>, redirectTo: string) {
  return async (e: Error): Promise<Response> => {
    if (!(e instanceof ResponseError)) throw e;

    if (e.response.status === 401) {
      const query = new URLSearchParams();
      query.set("return_to", redirectTo);
      return ctx.redirect(getUrlForFlow(kratosBrowserUrl, "login", query), 302);
    }

    if (
      e.response.status === 404 ||
      e.response.status === 410 ||
      e.response.status === 403
    ) {
      try {
        const body = await e.response.clone().json();
        if (isSessionAal2Required(body)) {
          return ctx.redirect(body.redirect_browser_to || redirectTo, 302);
        }
      } catch {
        // ignore parse errors
      }
      return ctx.redirect(redirectTo, 302);
    }

    throw e;
  };
}
