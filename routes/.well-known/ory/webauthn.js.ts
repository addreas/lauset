import { define } from "@/lib/fresh.ts";
import { frontend } from "@/lib/sdk/index.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/static.ts
export const handler = define.handlers({
  GET() {
    return frontend.getWebAuthnJavaScript().then(
      (data) =>
        new Response(data, {
          status: 200,
          headers: {
            "Content-Type": "text/javascript; charset=utf-8",
          },
        }),
    );
  },
});
