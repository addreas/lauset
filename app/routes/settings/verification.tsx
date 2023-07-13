import { Center, Heading, Stack } from "@chakra-ui/react";
import { VerificationFlow } from "@ory/client";
import { Link, useLoaderData } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import { BasicUI } from "~/components/BasicUI";
import { Messages } from "~/components/Messages";
import { UIForm } from "~/components/ui/UIForm";
import { getFlowOrRedirectToInit } from "~/utils/flow";
import { kratosFrontendApi } from "~/utils/ory.server";

export const loader: LoaderFunction = async ({ request }) => {
  return getFlowOrRedirectToInit(request, "verification", (id, cookie) =>
    kratosFrontendApi.getVerificationFlow({id, cookie})
  );
};

export default function Verification() {
  const data = useLoaderData<VerificationFlow>();
  console.log(data);
  return (
    <Stack>
      <Heading as="h1" size="lg">
        Verification
      </Heading>
      <Messages messages={data.ui.messages} />
      <UIForm ui={data.ui} showEmpty />
    </Stack>
  );
}
