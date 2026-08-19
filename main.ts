import { App, staticFiles } from "fresh";
import type { State } from "@/lib/fresh.ts";

export const app = new App<State>();

app.use(staticFiles());

// File-system based routes including route group middlewares
app.fsRoutes();
