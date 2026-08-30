import { define } from "@/lib/fresh.ts";
import { identity } from "@/lib/sdk/index.ts";
import { getUrlForFlow, kratosBrowserUrl } from "@/lib/index.ts";

const requireAdmin = define.middleware(async (ctx) => {
  const session = ctx.state.session;
  const identityId = session?.identity?.id;
  if (!identityId) return new Response("Not Found", { status: 404 });

  const kratosIdentity = await identity.getIdentity({ id: identityId })
    .catch(() => null);

  const isAdmin = (kratosIdentity?.metadata_admin as { admin?: unknown } | null)
    ?.admin === true;
  if (!isAdmin) return new Response("Not Found", { status: 404 });

  if (session?.authenticator_assurance_level !== "aal2") {
    const return_to = ctx.req.headers.get("x-original-uri") ??
      (ctx.url.pathname + ctx.url.search);
    return ctx.redirect(
      getUrlForFlow(
        kratosBrowserUrl,
        "login",
        new URLSearchParams({ aal: "aal2", return_to }),
      ),
    );
  }

  return ctx.next();
});

export default [requireAdmin];
