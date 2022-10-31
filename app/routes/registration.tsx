import { Box, Center, Container, useColorModeValue } from "@chakra-ui/react";
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
    <Box
      minH="100%"
      backgroundColor="#4158D0"
      backgroundImage="linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)"
      py={16}
    >
      <Container
        borderRadius="lg"
        boxShadow="lg"
        backgroundColor={useColorModeValue("white", "gray.800")}
      >
        <BasicUI
          heading="Create an account"
          ui={flow.ui}
          footer={
            <Center>
              <Link fontSize="sm" opacity={0.8} href="/login">
                Sign in
              </Link>
            </Center>
          }
        />
      </Container>
    </Box>
  );
}
