import {
  Container,
  Divider,
  Heading,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { UiContainer } from "@ory/client";
import { Messages } from "./Messages";
import { UIForm } from "./ui/UIForm";

export function BasicUI({
  ui,
  heading,
  footer,
}: {
  ui: UiContainer;
  heading: string;
  footer: JSX.Element;
}) {
  return (
    <Container>
      <Stack spacing={5}>
        <Container
          py={7}
          borderRadius="lg"
          boxShadow="lg"
          backgroundColor={useColorModeValue("white", "gray.800")}
        >
          <Stack>
            <Heading as="h1" size="lg">
              {heading}
            </Heading>
            <Messages messages={ui.messages} />
            <UIForm ui={ui} />
          </Stack>
        </Container>
        {footer}
      </Stack>
    </Container>
  );
}
