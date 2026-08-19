import { checkHandler } from "./index.ts";

// GEP-1494's ExternalAuth filter prepends `http.path` to the original request
// path, so auth requests arrive as /check/<original-path>.
export const handler = checkHandler((ctx) => "/" + ctx.params.path);
