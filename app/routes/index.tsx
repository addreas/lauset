import { LoaderFunction, redirect } from "@remix-run/server-runtime";

export const loader: LoaderFunction = () => {
  return redirect("/welcome", { status: 303 });
};
