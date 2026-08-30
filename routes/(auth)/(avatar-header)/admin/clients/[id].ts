import { define } from "@/lib/fresh.ts";
import { oauth2 } from "@/lib/sdk/index.ts";

// Form-submitted delete (a plain HTML form can't issue DELETE). Deletes the
// OAuth2 client then redirects back to the clients list — no island/JS required.
export const handler = define.handlers({
  async POST(ctx) {
    const id = ctx.params.id;
    if (!id) return new Response("missing client id", { status: 400 });
    try {
      await oauth2.deleteOAuth2Client({ id });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(message, { status: 500 });
    }
    return new Response(null, {
      status: 303,
      headers: { location: "/admin/clients" },
    });
  },
});
