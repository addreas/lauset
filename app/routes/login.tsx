import {
  Box,
  Center,
  Container,
  Divider,
  Heading,
  HStack,
  Spacer,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { SelfServiceLoginFlow } from "@ory/client";
import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import { Link } from "~/components/Link";
import { Messages } from "~/components/Messages";
import { UIForm } from "~/components/ui/UIForm";
import { getFlowOrRedirectToInit } from "~/utils/flow";
import {
  getUrlForKratosFlow,
  kratosBrowserUrl,
  kratosSdk,
} from "~/utils/ory.server";

type LoaderData = SelfServiceLoginFlow & {
  isAuthenticated: boolean;
  registerUrl: string;
  logoutUrl: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const login = await getFlowOrRedirectToInit(
    request,
    "login",
    (flow, cookie) => kratosSdk.getSelfServiceLoginFlow(flow, cookie)
  );

  const return_to = (
    new URL(request.url).searchParams.get("return_to") ?? ""
  ).toString();

  const registerUrl = getUrlForKratosFlow(
    kratosBrowserUrl,
    "registration",
    new URLSearchParams({ return_to })
  );

  const isAuthenticated = login.refresh || login.requested_aal === "aal2";

  const logoutUrl =
    (await kratosSdk
      .createSelfServiceLogoutFlowUrlForBrowsers(request.headers.get("Cookie")!)
      .then((r) => r.data.logout_url)
      .catch(() => "")) ?? "";

  return json<LoaderData>(
    {
      ...login,
      isAuthenticated,
      registerUrl,
      logoutUrl,
    }
    // { headers: { "Cache-Control": "max-age=5" } }
  );
};

export default function Login() {
  const data = useLoaderData<LoaderData>();

  return (
    <Container
      py={7}
      p={6}
      maxW="20rem"
      bg={useColorModeValue("white", "gray.800")}
      borderRadius="lg"
      boxShadow="lg"
    >
      <Stack>
        <Heading as="h1">
          {data.refresh
            ? "Confirm Action"
            : data.requested_aal === "aal2"
            ? "Two-Factor Authentication"
            : "Sign In"}
        </Heading>

        <Messages messages={data.ui.messages} alertProps={{ fontSize: "xs" }} />

        <Box pb={3}>
          <UIForm ui={data.ui} />
        </Box>

        <Divider />

        {data.isAuthenticated ? (
          <Center>
            <Link fontSize="sm" opacity={0.8} href={data.logoutUrl}>
              Log out
            </Link>
          </Center>
        ) : (
          <HStack>
            <Link fontSize="sm" opacity={0.8} href={data.registerUrl}>
              Sign up
            </Link>
            <Spacer />
            <Link fontSize="sm" opacity={0.8} to="/recovery">
              Recover lost credentials
            </Link>
          </HStack>
        )}
      </Stack>
    </Container>
  );
}
