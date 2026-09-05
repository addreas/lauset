import OryConsentCard from "@/islands/OryConsentCard.tsx";
import { define } from "@/lib/fresh.ts";
import { page } from "fresh";
import { toOAuth2ConsentRequest } from "@/lib/ory-types.ts";
import {
  AcceptOAuth2ConsentRequestSession,
  type OAuth2ConsentRequest,
} from "@ory/client";
import type { Identity } from "@ory/client-fetch";
import { identity, oauth2 } from "@/lib/sdk/index.ts";
import { isOAuthConsentRouteEnabled, shouldSkipConsent } from "@/lib/index.ts";

const extractSession = (
  identity: Identity | undefined,
  grantScope: string[],
): AcceptOAuth2ConsentRequestSession => {
  const session: AcceptOAuth2ConsentRequestSession = {
    access_token: {},
    id_token: {},
  };

  if (!identity) {
    return session;
  }

  if (grantScope.includes("email")) {
    const addresses = identity.verifiable_addresses || [];
    if (addresses.length > 0) {
      const address = addresses[0];
      if (address.via === "email") {
        session.id_token.email = address.value;
        session.id_token.email_verified = address.verified;
      }
    }
  }

  if (grantScope.includes("profile")) {
    if (identity.traits.username) {
      session.id_token.preferred_username = identity.traits.username;
    }

    if (identity.traits.website) {
      session.id_token.website = identity.traits.website;
    }

    if (typeof identity.traits.name === "object") {
      if (identity.traits.name.first) {
        session.id_token.given_name = identity.traits.name.first;
      }
      if (identity.traits.name.last) {
        session.id_token.family_name = identity.traits.name.last;
      }
    } else if (typeof identity.traits.name === "string") {
      session.id_token.name = identity.traits.name;
    }

    if (identity.updated_at) {
      session.id_token.updated_at = parseInt(
        (identity.updated_at.getTime() / 1000).toFixed(0),
      );
    }
  }
  return session;
};

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/consent.ts
export const handler = define.handlers<{
  consent: OAuth2ConsentRequest;
  challenge: string;
}>({
  async GET(ctx) {
    if (!isOAuthConsentRouteEnabled()) {
      return ctx.redirect("404");
    }

    // The challenge is used to fetch information about the consent request from ORY hydraAdmin.
    const challenge = ctx.url.searchParams.get("consent_challenge");
    if (!challenge) {
      throw new Error(
        "Expected a consent challenge to be set but received none.",
      );
    }

    // This section processes consent requests and either shows the consent UI or
    // accepts the consent request right away if the user has given consent to this
    // app before
    return await oauth2
      .getOAuth2ConsentRequest({ consentChallenge: challenge })
      // This will be called if the HTTP request was successful
      .then(async (body) => {
        // If a user has granted this application the requested scope, hydra will tell us to not show the UI.
        if (shouldSkipConsent(body)) {
          const grantScope = body.requested_scope || [];
          const session = extractSession(
            await identity.getIdentity({ id: body.subject! }),
            grantScope,
          );

          // Now it's time to grant the consent request. You could also deny the request if something went terribly wrong
          return await oauth2
            .acceptOAuth2ConsentRequest({
              consentChallenge: challenge,
              acceptOAuth2ConsentRequest: {
                // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
                // are requested accidentally.
                grant_scope: grantScope,

                // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
                grant_access_token_audience:
                  body.requested_access_token_audience,

                // The session allows us to set session data for id and access tokens
                session,
              },
            })
            // All we need to do now is to redirect the user back to hydra!
            .then((body) => ctx.redirect(body.redirect_to));
        }

        // If consent can't be skipped we MUST show the consent UI.
        return page({
          consent: toOAuth2ConsentRequest(body),
          challenge,
        });
      });
    // The consent request has now either been accepted automatically or rendered.
  },

  async POST(ctx) {
    if (!isOAuthConsentRouteEnabled()) {
      return ctx.redirect("404");
    }
    const rememberForEnv = Deno.env.get("REMEMBER_CONSENT_SESSION_FOR_SECONDS");
    const rememberFor = rememberForEnv ? Number(rememberForEnv) : 3600;
    const form = await ctx.req.formData();
    const challenge = form.get("consent_challenge")?.toString()!;
    const consent_action = form.get("consent_action")?.toString();
    const remember = form.get("remember")?.toString();
    const grantScope = form.getAll("grant_scope").map((e) => e.toString());

    // Let's fetch the consent request again to be able to set `grantAccessTokenAudience` properly.
    // Let's see if the user decided to accept or reject the consent request..
    if (consent_action === "accept") {
      return oauth2
        .getOAuth2ConsentRequest({ consentChallenge: challenge })
        .then(async (body) =>
          oauth2
            .acceptOAuth2ConsentRequest({
              consentChallenge: challenge,
              acceptOAuth2ConsentRequest: {
                // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
                // are requested accidentally.
                grant_scope: grantScope,

                session: extractSession(
                  await identity.getIdentity({ id: body.subject! }),
                  grantScope,
                ),

                // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
                grant_access_token_audience:
                  body.requested_access_token_audience,

                // This tells hydra to remember this consent request and allow the same client to request the same
                // scopes from the same user, without showing the UI, in the future.
                remember: Boolean(remember),

                // When this "remember" sesion expires, in seconds. Set this to 0 so it will never expire.
                remember_for: rememberFor,
              },
            })
            // All we need to do now is to redirect the user back!
            .then((body) => ctx.redirect(body.redirect_to))
        );
    }

    // Looks like the consent request was denied by the user
    return (
      oauth2
        .rejectOAuth2ConsentRequest({
          consentChallenge: challenge,
          rejectOAuth2Request: {
            error: "access_denied",
            error_description: "The resource owner denied the request",
          },
        })
        // All we need to do now is to redirect the browser back to hydra!
        .then((body) => ctx.redirect(body.redirect_to))
    );
  },
});

export default define.page<typeof handler>(({ data: { consent }, state }) => (
  <OryConsentCard
    locale={state.locale}
    consent={consent}
    cardImage={consent.client?.logo_uri}
    client_name={consent.client?.client_name || consent.client?.client_id ||
      "Unknown Client"}
    requested_scope={consent.requested_scope || []}
    client={consent.client}
  />
));
