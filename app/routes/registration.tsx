import { Text } from "@chakra-ui/react";
import { SelfServiceRegistrationFlow } from "@ory/client";
import { useLoaderData } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import { BasicUI } from "~/components/BasicUI";
import { Link } from "~/components/Link";
import { getFlowOrRedirectToInit } from "~/utils/flow";
import { kratosSdk } from "~/utils/ory.server";

export const loader: LoaderFunction = async ({ request }) => {
  // TODO: generate login url with return_to (https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/registration.ts)
  return getFlowOrRedirectToInit(request, "registration", (flow, cookie) =>
    kratosSdk.getSelfServiceRegistrationFlow(flow, cookie)
  );
};

export default function SignUp() {
  const flow = useLoaderData<SelfServiceRegistrationFlow>();
  return (
    <BasicUI
      heading="Create an account"
      ui={flow.ui}
      footer={
        <Link href="/login" fontSize="sm" color="#fff">
          Sign in
        </Link>
      }
    />
  );
}
