import { define } from "@/lib/fresh.ts";
import { identity } from "@/lib/sdk/index.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

// API-only (no page component) — mints a recovery CODE lazily for the
// RecoveryButton island, which copies it to the clipboard / reveals it inline.
export const handler = define.handlers({
  async POST(ctx) {
    const id = ctx.params.id;
    if (!id) return json({ error: "missing identity id" }, 400);
    try {
      const res = await identity.createRecoveryCodeForIdentity({
        createRecoveryCodeForIdentityBody: { identity_id: id },
      });
      return json({
        value: res.recovery_code,
        expires_at: res.expires_at
          ? new Date(res.expires_at).toISOString()
          : null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return json({ error: message }, 500);
    }
  },
});
