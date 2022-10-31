import { SelfServiceSettingsFlow } from "@ory/client";
import { json } from "@remix-run/server-runtime";
import { commitSession, getSession } from "~/sessions";
import { getFlowOrRedirectToInit } from "./flow";
import { kratosSdk } from "./ory.server";

export async function initSettingsFlow({ request }: { request: Request }) {
  const session = await getSession(request.headers.get("Cookie"));
  session.flash("settingsFlowRedirect", new URL(request.url).pathname);
  const newCookie = await commitSession(session);
  const headers = { "Set-Cookie": newCookie };

  return json<SelfServiceSettingsFlow>(
    await getFlowOrRedirectToInit(
      request,
      "settings",
      async (flow, cookie) => {
        return await kratosSdk.getSelfServiceSettingsFlow(
          flow,
          undefined,
          cookie
        );
      },
      headers
    ),
    { headers }
  );
}
