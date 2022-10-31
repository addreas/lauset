import { LoaderFunction } from "@remix-run/server-runtime";

export const loader: LoaderFunction = async () => {
  return new Response("ok", { status: 200 });
};
