import { locales } from "@ory/elements-preact";
import { define } from "@/lib/fresh.ts";

const supportedLocales = Object.keys(locales);

function pickLocale(header: string | null): string {
  if (header) {
    for (const part of header.split(",")) {
      const lang = part.split(";")[0].trim().toLowerCase().split("-")[0];
      if (lang && supportedLocales.includes(lang)) return lang;
    }
  }
  return "en";
}

export default define.middleware((ctx) => {
  ctx.state.locale = pickLocale(ctx.req.headers.get("accept-language"));
  return ctx.next();
});
