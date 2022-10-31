import { createCookieSessionStorage } from "@remix-run/node";
import { env } from "./config.server";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "lauset_session",
      domain: env?.COOKIE_DOMAIN,
      httpOnly: true,
      maxAge: 24 * 60 * 60,
      sameSite: "strict",
      secrets: [env?.COOKIE_SECRET],
      secure: true,
    },
  });

export { getSession, commitSession, destroySession };
