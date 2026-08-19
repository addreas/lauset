import { define } from "@/lib/fresh.ts";

export const handler = define.handlers({
  GET() {
    return new Response("", {
      status: 307,
      headers: { location: "/admin/identities" },
    });
  },
});

export default define.page<typeof handler>(() => null);
