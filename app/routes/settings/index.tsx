import { LoaderFunction, redirect } from "@remix-run/server-runtime";
import { commitSession, getSession } from "~/sessions";

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams;

  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  const sessionRedirect = session.get("settingsFlowRedirect");
  const newSession = await commitSession(session);

  if (sessionRedirect && params.get("flow")) {
    return redirect(`${sessionRedirect}?${params.toString()}`, {
      headers: { "Set-Cookie": newSession },
    });
  }

  return redirect("/");
};
