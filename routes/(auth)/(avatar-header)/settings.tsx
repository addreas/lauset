import OrySettingsSection from "@/islands/OrySettingsSection.tsx";
import { page } from "fresh";
import { define } from "@/lib/fresh.ts";
import { toSettingsFlow } from "@/lib/ory-types.ts";
import {
  getUrlForFlow,
  isQuerySet,
  kratosBrowserUrl,
  redirectOnSoftError,
} from "@/lib/index.ts";
import { frontend } from "@/lib/sdk/index.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/settings.ts

// Only same-origin relative paths so an attacker can't use the flow URL as an
// open redirect to an external site.
function validReturnTo(value: unknown): string {
  return typeof value === "string" &&
      value.startsWith("/") && !value.startsWith("//")
    ? value
    : "";
}

export const handler = define.handlers({
  GET(ctx) {
    const query = Object.fromEntries(ctx.url.searchParams);
    const { flow } = query;
    const return_to = validReturnTo(query.return_to) || "";

    const initFlowUrl = getUrlForFlow(
      kratosBrowserUrl,
      "settings",
      new URLSearchParams({ return_to }),
    );

    // The flow is used to identify the settings and registration flow and
    // return data like the csrf_token and so on.
    if (!isQuerySet(flow)) {
      console.debug(
        "No flow ID found in URL query initializing settings flow",
        {
          query,
        },
      );
      return ctx.redirect(initFlowUrl, 303);
    }

    return frontend
      .getSettingsFlow({ id: flow, cookie: ctx.req.headers.get("cookie")! })
      .then((flow) => {
        return page({ flow: toSettingsFlow(flow) });
      })
      .catch(redirectOnSoftError(ctx, initFlowUrl));
  },
});

export default define.page<typeof handler>(({ data, state }) => {
  return (
    <OrySettingsSection
      flow={data.flow}
      locale={state.locale}
    />
  );
});
