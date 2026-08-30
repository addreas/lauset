import { define } from "@/lib/fresh.ts";
import { identity } from "@/lib/sdk/index.ts";

// Form-submitted write ops (a plain HTML form can't issue DELETE/PUT). The
// action is read from the form body so each identity card can host several
// buttons sharing this route — no island/JS required.
export const handler = define.handlers({
  async POST(ctx) {
    const id = ctx.params.id;
    if (!id) return new Response("missing identity id", { status: 400 });

    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "");

    try {
      switch (action) {
        case "delete":
          await identity.deleteIdentity({ id });
          break;
        case "sign-out":
          await identity.deleteIdentitySessions({ id });
          break;
        case "disable-session": {
          const sessionId = String(form.get("sessionId") ?? "");
          if (!sessionId) {
            return new Response("missing session id", { status: 400 });
          }
          await identity.disableSession({ id: sessionId });
          break;
        }
        case "update-metadata": {
          const current = await identity.getIdentity({ id });
          const parseJson = (raw: string): unknown => {
            const trimmed = raw.trim();
            return trimmed === "" ? null : JSON.parse(trimmed);
          };
          const metadata_admin = parseJson(
            String(form.get("metadata_admin") ?? ""),
          );
          const metadata_public = parseJson(
            String(form.get("metadata_public") ?? ""),
          );
          await identity.updateIdentity({
            id,
            updateIdentityBody: {
              schema_id: current.schema_id,
              state: current.state ?? "active",
              traits: current.traits ?? {},
              metadata_admin,
              metadata_public,
            },
          });
          break;
        }
        default:
          return new Response(`unknown action: ${action}`, { status: 400 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(message, { status: 500 });
    }
    return new Response(null, {
      status: 303,
      headers: { location: "/admin/identities" },
    });
  },
});
