import { csrf } from "fresh";
import { handleCsrfError } from "@/lib/middleware.ts";

export default [handleCsrfError, csrf()];
