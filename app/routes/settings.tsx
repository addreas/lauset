import {
  Avatar,
  Container,
  Heading,
  HStack,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { Session } from "@ory/client";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import md5 from "md5";
import { kratosSdk } from "~/utils/ory.server";

type LoaderData = { gravatarHash: string | null; userFullName: string };

export const loader: LoaderFunction = async ({ request }) => {
  const cookie = request.headers.get("cookie") ?? undefined;

  let userInfo: Session | null = null;
  if (cookie?.includes("session")) {
    const { data } = await kratosSdk
      .toSession(undefined, cookie)
      .catch(() => ({ data: null }));
    userInfo = data;
  }

  // if (!userInfo) {
  //   throw redirect("/welcome");
  // }

  const userId = userInfo?.identity.verifiable_addresses?.[0]?.value ?? null;
  const gravatarHash = userId ? md5(userId.toLowerCase()) : null;

  // console.log({ gravatarHash });

  return json<LoaderData>({
    gravatarHash,
    userFullName: "Jonas Dahl", // await getUserFullName(userInfo),
  });
};

export default function Settings() {
  const { gravatarHash, userFullName } = useLoaderData<LoaderData>();

  return (
    <Container>
      <Stack spacing={5}>
        <HStack>
          <Avatar
            src={
              gravatarHash
                ? `https://www.gravatar.com/avatar/${gravatarHash}.jpg`
                : undefined
            }
          />

          <Heading as="h1" color="white" textAlign="center" maxW="30rem">
            <Link to="/welcome">{userFullName}</Link>
          </Heading>
        </HStack>

        <Container
          p={6}
          bg={useColorModeValue("white", "gray.800")}
          borderRadius="lg"
          boxShadow="lg"
        >
          <Outlet />
        </Container>

        <Link to="/welcome">
          <Text as="span" color="#fff">
            Go back
          </Text>
        </Link>
      </Stack>
    </Container>
  );
}
