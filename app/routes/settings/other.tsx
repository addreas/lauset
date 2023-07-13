import { Heading, Stack, Text } from "@chakra-ui/react";
import { SettingsFlow } from "@ory/client";
import { useLoaderData } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import { Messages } from "~/components/Messages";
import { UIForm } from "~/components/ui/UIForm";
import { initSettingsFlow } from "~/utils/settings-flow.server";

type LoaderData = SettingsFlow;

export const loader: LoaderFunction = async ({ request }) => {
  return initSettingsFlow({ request });
};

export default function OtherSettings() {
  const data = useLoaderData<LoaderData>();

  return (
    <Stack>
      <Messages messages={data.ui.messages} />

      <UIForm
        ui={data.ui}
        groups={["oidc"]}
        before={
          <Heading as="h3" fontSize="xl">
            Manage Social Sign In
          </Heading>
        }
      />

      <UIForm
        ui={data.ui}
        groups={["webauthn"]}
        before={
          <>
            <Heading as="h3" fontSize="xl">
              Manage Hardware Tokens and Biometrics
            </Heading>
            <Text>
              Use Hardware Tokens (e.g. YubiKey) or Biometrics (e.g. FaceID,
              TouchID) to enhance your account security.
            </Text>
          </>
        }
      />
    </Stack>
  );
}
