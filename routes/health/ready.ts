import { define } from "@/lib/fresh.ts";

export const handler = define.handlers({
  GET() {
    return new Response("ok", { status: 200 });
  },
});
