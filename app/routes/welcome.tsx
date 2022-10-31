import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Avatar,
  Box,
  Button,
  Code,
  Container,
  Grid,
  GridItem,
  Heading,
  LinkBox,
  LinkOverlay,
  Stack,
  Tooltip,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  faEllipsisH,
  faRotate,
  faUser,
  faWallet,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Session } from "@ory/kratos-client";
import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunction, redirect } from "@remix-run/server-runtime";
import md5 from "md5";
import { forwardRef } from "react";
import { Link } from "~/components/Link";
import { UIScreenButton } from "~/components/ui/UIScreenButton";
import { kratosSdk } from "~/utils/ory.server";
import { getUserFullName } from "~/utils/user.server";

type LoaderData = {
  logoutUrl: string;
  userInfo: Session;
  gravatarHash: string | null;
  userId: string | null;
  userFullName: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const cookie = request.headers.get("cookie") ?? undefined;
  const { logout_url: logoutUrl } = await kratosSdk
    .createSelfServiceLogoutFlowUrlForBrowsers(cookie)
    .then((r) => r.data)
    .catch((e) => {
      console.error("welcome, createSelfServiceLogoutFlowUrlForBrowsers", e);
      return { logout_url: "https://google.com" };
    });

  let userInfo: Session | null = null;
  if (cookie?.includes("session")) {
    const { data } = await kratosSdk.toSession(undefined, cookie).catch((e) => {
      console.error("welcome, kratosSdk.toSession", e);
      return { data: null };
    });
    userInfo = data;
  }

  if (!userInfo) {
    console.error("missing userInfo, redirecting to", logoutUrl);
    throw redirect(logoutUrl);
  }

  const userId = userInfo.identity.verifiable_addresses?.[0]?.value ?? null;
  const gravatarHash = userId ? md5(userId.toLowerCase()) : null;

  return json<LoaderData>({
    logoutUrl,
    userInfo,
    gravatarHash,
    userId,
    userFullName: await getUserFullName(userInfo),
  });
};

export default function Welcome() {
  const { logoutUrl, userInfo, gravatarHash, userFullName } =
    useLoaderData<LoaderData>();

  return (
    <Container maxW="container.xl">
      <VStack spacing={5}>
        <Tooltip label="Change your avatar on gravatar.com">
          <Avatar
            src={
              gravatarHash
                ? `https://www.gravatar.com/avatar/${gravatarHash}.jpg`
                : undefined
            }
            size="xl"
          />
        </Tooltip>

        <Heading as="h1" color="white" textAlign="center">
          Welcome, {userFullName}
        </Heading>

        <Container
          maxW="container.lg"
          bg={useColorModeValue("white", "gray.800")}
          borderRadius="lg"
          boxShadow="lg"
          p={6}
        >
          <Stack spacing={5}>
            <Heading size="md">Account settings</Heading>
            <Grid
              templateColumns={{
                base: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              }}
            >
              <MenuItem
                icon={faUser}
                href="/settings/profile"
                label="User profile"
              />
              <MenuItem
                icon={faRotate}
                href="/settings/password"
                label="Change password"
              />
              <MenuItem
                icon={faWallet}
                href="/settings/2fa"
                label="Manage 2FA"
              />
              <MenuItem
                icon={faEllipsisH}
                href="/settings/other"
                label="Other settings"
              />
            </Grid>
          </Stack>
        </Container>

        <Container
          maxW="container.lg"
          bg={useColorModeValue("white", "gray.800")}
          borderRadius="lg"
          boxShadow="lg"
          p={6}
        >
          <Stack spacing={5}>
            <Stack>
              <UIScreenButton href="/verification">
                Verify account
              </UIScreenButton>
              <UIScreenButton href={logoutUrl}>Logout</UIScreenButton>

              <Accordion allowMultiple>
                <AccordionItem border="none">
                  <AccordionButton as={Button}>
                    <h2>
                      <AccordionIcon /> Session information
                    </h2>
                  </AccordionButton>
                  <AccordionPanel>
                    <Code as="pre" p={4} overflowX="auto" maxW="100%">
                      {JSON.stringify(userInfo, null, 2)}
                    </Code>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Stack>
          </Stack>
        </Container>
      </VStack>
    </Container>
  );
}

function MenuItem({
  icon,
  label,
  href,
}: {
  href: string;
  label: string;
  icon: IconDefinition;
}) {
  return (
    <GridItem>
      <LinkBox
        _hover={{ bg: "rgba(125,125,125,0.1)" }}
        py={3}
        borderRadius="md"
      >
        <VStack textAlign="center">
          <Box fontSize="5xl">
            <FontAwesomeIcon icon={icon} />
          </Box>
          <LinkOverlay
            as={forwardRef<HTMLAnchorElement>((props, ref) => (
              <Link href={href} {...props} ref={ref} /> // @todo Needs remix support since the routes contain redirect()s to external sites but on same domain
            ))}
          >
            {label}
          </LinkOverlay>
        </VStack>
      </LinkBox>
    </GridItem>
  );
}
