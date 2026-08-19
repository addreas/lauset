import OryAuthCard from "@/islands/OryAuthCard.tsx";
import { page } from "fresh";
import { define } from "@/lib/fresh.ts";
import {
  getUrlForFlow,
  isQuerySet,
  kratosBrowserUrl,
  redirectOnSoftError,
} from "@/lib/index.ts";
import { FetchLoginFlow, toLoginFlow } from "@/lib/ory-types.ts";
import { frontend } from "@/lib/sdk/index.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/login.ts
export const handler = define.handlers({
  GET(ctx) {
    const query = Object.fromEntries(ctx.url.searchParams);

    const {
      flow,
      aal = "",
      refresh = "",
      return_to = "",
      organization = "",
      via = "",
      login_challenge,
      identity_schema,
    } = query;

    const initFlowQuery = new URLSearchParams({
      aal,
      refresh,
      return_to,
      organization,
      via,
    });

    if (isQuerySet(login_challenge)) {
      console.debug("login_challenge found in URL query: ", { query });
      initFlowQuery.append("login_challenge", login_challenge);
    }
    if (isQuerySet(identity_schema)) {
      initFlowQuery.append("identity_schema", identity_schema);
    }

    const initFlowUrl = getUrlForFlow(kratosBrowserUrl, "login", initFlowQuery);

    // The flow is used to identify the settings and registration flow and
    // return data like the csrf_token and so on.
    if (!isQuerySet(flow)) {
      console.debug("No flow ID found in URL query initializing login flow", {
        query,
      });
      return ctx.redirect(initFlowUrl, 303);
    }

    // It is probably a bit strange to have a logout URL here, however this screen
    // is also used for 2FA flows. If something goes wrong there, we probably want
    // to give the user the option to sign out!
    const getLogoutUrl = (loginFlow: FetchLoginFlow) => {
      return frontend
        .createBrowserLogoutFlow({
          cookie: ctx.req.headers.get("cookie")!,
          returnTo: (return_to && return_to.toString()) ||
            loginFlow.return_to || "",
        })
        .then((data) => data.logout_url)
        .catch((err) =>
          console.error("Unable to create logout URL", { error: err })
        );
    };

    const redirectToVerificationFlow = (loginFlow: FetchLoginFlow) => {
      // we will create a new verification flow and redirect the user to the verification page
      return frontend
        .createBrowserVerificationFlowRaw({
          returnTo: (return_to && return_to.toString()) ||
            loginFlow.return_to || "",
        })
        .then(async (resp) => ({
          headers: resp.raw.headers,
          data: await resp.value(),
        }))
        .then(({ headers, data: verificationFlow }) => {
          // we need the csrf cookie from the verification flow
          const responseHeaders = new Headers();
          for (const cookie of headers.getSetCookie()) {
            responseHeaders.append("set-cookie", cookie);
          }
          // encode the verification flow id in the query parameters
          const verificationParameters = new URLSearchParams({
            flow: verificationFlow.id,
            message: JSON.stringify(loginFlow.ui.messages),
          });

          responseHeaders.set(
            "location",
            `/verification?${verificationParameters.toString()}`,
          );
          // redirect to the verification page with the custom message
          return new Response(null, { status: 303, headers: responseHeaders });
        })
        .catch(
          redirectOnSoftError(
            ctx,
            getUrlForFlow(
              kratosBrowserUrl,
              "verification",
              new URLSearchParams({
                return_to: (return_to && return_to.toString()) ||
                  loginFlow.return_to ||
                  "",
                ...(loginFlow.identity_schema && {
                  identity_schema: loginFlow.identity_schema,
                }),
              }),
            ),
          ),
        );
    };

    return frontend
      .getLoginFlow({ id: flow, cookie: ctx.req.headers.get("cookie")! })
      .then(async (flow) => {
        if (flow.ui.messages && flow.ui.messages.length > 0) {
          // the login requires that the user verifies their email address before logging in
          if (flow.ui.messages.some(({ id }) => id === 4000010)) {
            // we will create a new verification flow and redirect the user to the verification page
            return redirectToVerificationFlow(flow);
          }
        }

        // Render the data using a view (e.g. Jade Template):
        const initRegistrationQuery = new URLSearchParams({
          return_to: (return_to && return_to.toString()) || flow.return_to ||
            "",
          ...(flow.identity_schema && {
            identity_schema: flow.identity_schema.toString(),
          }),
          ...(flow.oauth2_login_request?.challenge && {
            login_challenge: flow.oauth2_login_request.challenge,
          }),
        });

        let initRecoveryUrl = "";
        const initRegistrationUrl = getUrlForFlow(
          kratosBrowserUrl,
          "registration",
          initRegistrationQuery,
        );
        if (!flow.refresh) {
          initRecoveryUrl = getUrlForFlow(
            kratosBrowserUrl,
            "recovery",
            new URLSearchParams({
              return_to: (return_to && return_to.toString()) ||
                flow.return_to || "",
            }),
          );
        }

        let logoutUrl: string = "";
        if (flow.requested_aal === "aal2" || flow.refresh) {
          logoutUrl = (await getLogoutUrl(flow)) ?? "";
        }

        return page({
          flow: toLoginFlow(flow),
          flowType: "login",
          additionalProps: {
            forgotPasswordURL: initRecoveryUrl,
            signupURL: initRegistrationUrl,
            logoutURL: logoutUrl,
            loginURL: initFlowUrl,
          },
        });
      })
      .catch(redirectOnSoftError(ctx, initFlowUrl));
  },
});

export default define.page<typeof handler>(({ data, state }) => (
  <OryAuthCard
    flow={data.flow}
    flowType="login"
    additionalProps={data.additionalProps}
    locale={state.locale}
    className="ory-user-auth-card"
  />
));
