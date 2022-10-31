import { Center } from "@chakra-ui/react";
import { SelfServiceVerificationFlow } from "@ory/client";
import { Link, useLoaderData } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import { BasicUI } from "~/components/BasicUI";
import { getFlowOrRedirectToInit } from "~/utils/flow";
import { kratosSdk } from "~/utils/ory.server";

export const loader: LoaderFunction = async ({ request }) => {
  return getFlowOrRedirectToInit(request, "verification", (flow, cookie) =>
    kratosSdk.getSelfServiceVerificationFlow(flow, cookie)
  );
};

export default function Verification() {
  const data = useLoaderData<SelfServiceVerificationFlow>();
  return (
    <BasicUI
      ui={data.ui}
      heading="Verification"
      footer={
        <Center>
          <Link to="/">Go back</Link>
        </Center>
      }
    />
  );
}
