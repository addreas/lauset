import OryAuthCard from "@/islands/OryAuthCard.tsx";
import { page } from "fresh";
import { define } from "@/lib/fresh.ts";
import {
  getUrlForFlow,
  isQuerySet,
  kratosBrowserUrl,
  redirectOnSoftError,
} from "@/lib/index.ts";
import { toRecoveryFlow } from "@/lib/ory-types.ts";
import { frontend } from "@/lib/sdk/index.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/recovery.ts
export const handler = define.handlers({
  GET(ctx) {
    const query = Object.fromEntries(ctx.url.searchParams);

    const { flow, return_to = "" } = query;

    const initFlowUrl = getUrlForFlow(
      kratosBrowserUrl,
      "recovery",
      new URLSearchParams({ return_to }),
    );

    // The flow is used to identify the settings and registration flow and
    // return data like the csrf_token and so on.
    if (!isQuerySet(flow)) {
      return ctx.redirect(initFlowUrl, 303);
    }

    return frontend
      .getRecoveryFlow({ id: flow, cookie: ctx.req.headers.get("cookie")! })
      .then((flow) => {
        const initLoginUrl = getUrlForFlow(
          kratosBrowserUrl,
          "login",
          new URLSearchParams({
            return_to: (return_to && return_to.toString()) || flow.return_to ||
              "",
          }),
        );

        return page({
          flow: toRecoveryFlow(flow),
          flowType: "recovery",
          additionalProps: {
            loginURL: initLoginUrl,
          },
        });
      })
      .catch(redirectOnSoftError(ctx, initFlowUrl));
  },
});

export default define.page<typeof handler>(({ data, state }) => (
  <OryAuthCard
    flow={data.flow}
    flowType="recovery"
    additionalProps={data.additionalProps}
    locale={state.locale}
    className="ory-user-auth-card"
  />
));
