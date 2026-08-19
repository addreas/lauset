import { define } from "@/lib/fresh.ts";
import { Head } from "fresh/runtime";

export default define.page(function App({ Component }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="/.well-known/ory/webauthn.js" async />
        <Head>
          <title>Lauset</title>
        </Head>
      </head>
      <body>
        <div class="auth-bg">
          <div class="page">
            <Component />
          </div>
        </div>
      </body>
    </html>
  );
});
