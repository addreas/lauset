import OryAuthCard from "@/islands/OryAuthCard.tsx";
import { page } from "fresh";
import { define } from "@/lib/fresh.ts";
import {
  getUrlForFlow,
  isQuerySet,
  kratosBrowserUrl,
  redirectOnSoftError,
} from "@/lib/index.ts";
import { toRegistrationFlow } from "@/lib/ory-types.ts";
import { frontend } from "@/lib/sdk/index.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/registration.ts
export const handler = define.handlers({
  GET(ctx) {
    const query = Object.fromEntries(ctx.url.searchParams);

    const {
      flow,
      return_to,
      after_verification_return_to,
      login_challenge,
      organization,
      identity_schema = "",
    } = query;

    const initFlowQuery = new URLSearchParams({
      ...(return_to && { return_to: return_to.toString() }),
      ...(organization && { organization: organization.toString() }),
      ...(identity_schema && { identity_schema: identity_schema.toString() }),
      ...(after_verification_return_to && {
        after_verification_return_to: after_verification_return_to.toString(),
      }),
    });

    if (isQuerySet(login_challenge)) {
      initFlowQuery.append("login_challenge", login_challenge);
    }

    const initFlowUrl = getUrlForFlow(
      kratosBrowserUrl,
      "registration",
      initFlowQuery,
    );

    // The flow is used to identify the settings and registration flow and
    // return data like the csrf_token and so on.
    if (!isQuerySet(flow)) {
      return ctx.redirect(initFlowUrl, 303);
    }

    return frontend
      .getRegistrationFlow({ id: flow, cookie: ctx.req.headers.get("Cookie")! })
      .then((flow) => {
        // Render the data using a view (e.g. Jade Template):
        const initLoginQuery = new URLSearchParams({
          return_to: (return_to && return_to.toString()) || flow.return_to ||
            "",
          ...(flow.identity_schema && {
            identity_schema: flow.identity_schema.toString(),
          }),
          ...(flow.oauth2_login_request?.challenge && {
            login_challenge: flow.oauth2_login_request.challenge,
          }),
        });

        return page({
          flow: toRegistrationFlow(flow),
          flowType: "registration",
          additionalProps: {
            loginURL: getUrlForFlow(kratosBrowserUrl, "login", initLoginQuery),
          },
        });
      })
      .catch(redirectOnSoftError(ctx, initFlowUrl));
  },
});

export default define.page<typeof handler>(({ data, state }) => (
  <OryAuthCard
    flow={data.flow}
    flowType="registration"
    additionalProps={data.additionalProps}
    locale={state.locale}
    className="ory-user-auth-card"
  />
));
