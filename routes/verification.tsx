import OryAuthCard from "@/islands/OryAuthCard.tsx";
import { page } from "fresh";
import { define } from "@/lib/fresh.ts";
import {
  getUrlForFlow,
  isQuerySet,
  kratosBrowserUrl,
  redirectOnSoftError,
} from "@/lib/index.ts";
import { toVerificationFlow } from "@/lib/ory-types.ts";
import type { UiText } from "@ory/client";
import { frontend } from "@/lib/sdk/index.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/verification.ts
export const handler = define.handlers({
  GET(ctx) {
    const query = Object.fromEntries(ctx.url.searchParams);

    const { flow, return_to = "", message } = query;

    const initFlowUrl = getUrlForFlow(
      kratosBrowserUrl,
      "verification",
      new URLSearchParams({ return_to }),
    );

    // The flow is used to identify the settings and registration flow and
    // return data like the csrf_token and so on.
    if (!isQuerySet(flow)) {
      return ctx.redirect(initFlowUrl, 303);
    }

    return frontend
      .getVerificationFlow({
        id: flow,
        cookie: ctx.req.headers.get("cookie")!,
      })
      .then((flow) => {
        const initRegistrationUrl = getUrlForFlow(
          kratosBrowserUrl,
          "registration",
          new URLSearchParams({
            return_to: (return_to && return_to.toString()) || flow.return_to ||
              "",
          }),
        );

        // check for custom messages in the query string
        if (isQuerySet(message)) {
          const m: UiText[] = JSON.parse(message);

          // add them to the flow data so they can be rendered by the UI
          flow.ui.messages = [...(flow.ui.messages || []), ...m];
        }

        // Render the data using a view (e.g. Jade Template):
        return page({
          flow: toVerificationFlow(flow),
          flowType: "verification",
          additionalProps: {
            signupURL: initRegistrationUrl,
          },
        });
      })
      .catch(redirectOnSoftError(ctx, initFlowUrl));
  },
});

export default define.page<typeof handler>(({ data, state }) => (
  <OryAuthCard
    flow={data.flow}
    flowType="verification"
    additionalProps={data.additionalProps}
    locale={state.locale}
    className="ory-user-auth-card"
  />
));
