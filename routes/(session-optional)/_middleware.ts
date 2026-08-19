import { csrf, HttpError } from "fresh";
import { define } from "@/lib/fresh.ts";
import { setSession } from "@/lib/middleware.ts";

const handleCsrfError = define.middleware(async (ctx) => {
  try {
    return await ctx.next();
  } catch (err) {
    if (err instanceof HttpError && err.status === 403) {
      console.debug(
        "CSRF violation detected — the request origin or Sec-Fetch-Site header was invalid.",
        { url: ctx.req.url },
      );
      return new Response(
        "<h1>A security violation was detected, please fill out the form again.</h1>",
        {
          status: 403,
          headers: { "Content-Type": "text/html" },
        },
      );
    }
    throw err;
  }
});

export default [setSession, handleCsrfError, csrf()];
