import { requireAuth } from "@/lib/middleware.ts";
import { define } from "@/lib/fresh.ts";
import { generateGravatarHash, getUserFullName } from "@/lib/user.ts";

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
export default [requireAuth, injectUserInfo];
