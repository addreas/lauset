import { Text } from "@chakra-ui/react";
import { SelfServiceRecoveryFlow } from "@ory/client";
import { useLoaderData } from "@remix-run/react";
import { LoaderArgs, json } from "@remix-run/server-runtime";
import { BasicUI } from "~/components/BasicUI";
import { Link } from "~/components/Link";
import { getFlowOrRedirectToInit } from "~/utils/flow";
import { kratosSdk } from "~/utils/ory.server";

export const loader = async ({ request }: LoaderArgs) => {
  return json(
    await getFlowOrRedirectToInit(request, "recovery", (flow, cookie) =>
      kratosSdk.getSelfServiceRecoveryFlow(flow, cookie)
    )
  );
};

export default function Recovery() {
  const data = useLoaderData<typeof loader>();
  return (
    <BasicUI
      ui={data.ui}
      heading="Recovery"
      footer={
        <Link href="/login" fontSize="sm" color="#fff">
          Sign in
        </Link>
      }
    />
  );
}
