import { LoaderFunction, redirect } from "@remix-run/server-runtime";
import crypto from "crypto";
import { commitSession, getSession } from "~/sessions";
import {
  getUrlForKratosFlow,
  hydraAdmin,
  kratosBrowserUrl,
  kratosSdk,
} from "~/utils/ory.server";

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams;
  const hydraChallenge = params.get("login_challenge");

  if (!hydraChallenge) {
    throw new Error(
      "Missing Hydra challenge. (query parameter login_challenge)"
    );
  }

  const { data } = await hydraAdmin.getLoginRequest(hydraChallenge);
  if (data.skip) {
    // You can apply logic here, for example update the number of times the user logged in...
    // Now it's time to grant the login kratosRequest. You could also deny the kratosRequest if something went terribly wrong
    // (e.g. your arch-enemy logging in...)
    console.debug("Accepting ORY Hydra Login Request because skip is true");
    const {
      data: { redirect_to },
    } = await hydraAdmin.acceptLoginRequest(hydraChallenge, {
      subject: data.subject,
    });

    // All we need to do now is to redirect the user back to hydra!
    return redirect(redirect_to);
  }

  const hydraLoginState = params.get("hydra_login_state");
  if (!hydraLoginState) {
    console.debug(
      "Redirecting to login page because hydra_login_state was not found in the HTTP URL query parameters."
    );
    return redirectToLogin(request);
  }

  const session = await getSession(request.headers.get("Cookie"));
  if (hydraLoginState !== session.get("hydraLoginState")) {
    console.debug(
      "Redirecting to login page because login states do not match."
    );
    return redirectToLogin(request);
  }

  try {
    // We need to know who the user is for hydra
    const { data: userInfo } = await kratosSdk.toSession(
      undefined,
      request.headers.get("Cookie")!
    );

    // User is authenticated, accept the LoginRequest and tell Hydra
    const {
      data: { redirect_to },
    } = await hydraAdmin.acceptLoginRequest(hydraChallenge, {
      // We need to get the email of the user. We don't want to do that via traits as
      // they are dynamic. They would be part of the PublicAPI. That's not true
      // for identity.addresses So let's get it via the AdmninAPI
      subject: userInfo.identity.id,
      context: userInfo,
    });

    // All we need to do now is to redirect the user back to hydra!
    return redirect(redirect_to);
  } catch (e: any) {
    if (e.response && e.response.status === 403) {
      return redirectToLogin(request, { aal: "aal2" }, true);
    } else {
      return redirectToLogin(request);
    }
  }
};

async function redirectToLogin(
  request: Request,
  loginParams?: Record<string, string>,
  preserveState?: boolean
) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session) {
    throw new Error("failed to get session");
  }

  const state = !!preserveState
    ? session.get("hydraLoginState")
    : crypto.randomBytes(48).toString("hex");
  session.set("hydraLoginState", state);

  const return_to = new URL(request.url);
  return_to.protocol = request.headers.get("X-Forwarded-Proto") ?? "http";
  return_to.searchParams.set("hydra_login_state", state);

  const redirect_to = getUrlForKratosFlow(
    kratosBrowserUrl,
    "login",
    new URLSearchParams({
      return_to: return_to.toString(),
      // Maybe only refresh sometimes depending on some setting?
      // refresh: "true",
      ...loginParams,
    })
  );

  return redirect(redirect_to, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}
