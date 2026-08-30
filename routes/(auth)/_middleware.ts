import { csp, csrf } from "fresh";
import { requireAuth } from "@/lib/middleware.ts";
import { define } from "@/lib/fresh.ts";
import { kratosBrowserUrl } from "@/lib/index.ts";
import { generateGravatarHash, getUserFullName } from "@/lib/user.ts";

const noStore = define.middleware(async (ctx) => {
  const res = await ctx.next();
  res.headers.set("Cache-Control", "no-store");
  return res;
});

const injectUserInfo = define.middleware((ctx) => {
  if (ctx.state.session?.identity) {
    const identity = ctx.state.session.identity;
    ctx.state.userInfo = {
      gravatarHash: generateGravatarHash(identity),
      userFullName: getUserFullName(identity),
    };
  }

  return ctx.next();
});
export default [
  csp({
    csp: [
      `connect-src 'self' ${kratosBrowserUrl}`,
      `form-action 'self' ${kratosBrowserUrl}`,
      "img-src 'self' data: https://www.gravatar.com",
    ],
  }),
  csrf(),
  noStore,
  requireAuth,
  injectUserInfo,
];
