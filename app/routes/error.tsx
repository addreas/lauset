import { Code } from "@chakra-ui/react";
import { FlowError } from "@ory/client";
import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunction, redirect } from "@remix-run/server-runtime";
import { kratosFrontendApi } from "~/utils/ory.server";

type LoaderData = FlowError;

export const loader: LoaderFunction = async ({ request }) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return redirect("/");
  }
  const error = await kratosFrontendApi.getFlowError({id});
  return json<LoaderData>(error.data, {
    status: error.status,
    statusText: error.statusText,
  });
};

export default function ErrorView() {
  const error = useLoaderData<LoaderData>();
  return (
    <Code>
      <pre>{JSON.stringify(error.error, null, 4)}</pre>
    </Code>
  );
}
