import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { SelfServiceSettingsFlow } from "@ory/client";
import { useLoaderData } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import { Messages } from "~/components/Messages";
import { UIForm } from "~/components/ui/UIForm";
import { initSettingsFlow } from "~/utils/settings-flow.server";

type LoaderData = SelfServiceSettingsFlow;

export const loader: LoaderFunction = async ({ request }) => {
  return initSettingsFlow({ request });
};

export default function ProfileSettings() {
  const data = useLoaderData<LoaderData>();

  return (
    <Stack>
      <Heading as="h1" size="lg">
        Manage 2FA
      </Heading>
      <Messages messages={data.ui.messages} />
      <UIForm ui={data.ui} groups={["totp"]} showEmpty />

      <Box h={6} />
      <UIForm
        ui={data.ui}
        groups={["lookup_secret"]}
        before={
          <>
            <Heading as="h3" fontSize="xl">
              Manage 2FA Backup Recovery Codes
            </Heading>
            <Text>
              Recovery codes can be used in panic situations where you have lost
              access to your 2FA device.
            </Text>
          </>
        }
      />
    </Stack>
  );
}
