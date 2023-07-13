import { SettingsFlow } from "@ory/client";
import { json } from "@remix-run/server-runtime";
import { commitSession, getSession } from "~/sessions";
import { getFlowOrRedirectToInit } from "./flow";
import { kratosFrontendApi } from "./ory.server";

export async function initSettingsFlow({ request }: { request: Request }) {
  const session = await getSession(request.headers.get("Cookie"));
  session.flash("settingsFlowRedirect", new URL(request.url).pathname);
  const newCookie = await commitSession(session);
  const headers = { "Set-Cookie": newCookie };

  return json<SettingsFlow>(
    await getFlowOrRedirectToInit(
      request,
      "settings",
      (id, cookie) => kratosFrontendApi.getSettingsFlow({ id, cookie }),
      headers
    ),
    { headers }
  );
}
