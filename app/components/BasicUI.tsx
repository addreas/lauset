import { Container, Divider, Heading, Stack } from "@chakra-ui/react";
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
    <Container py={7}>
      <Stack>
        <Heading as="h1" size="lg">
          {heading}
        </Heading>
        <Messages messages={ui.messages} />
        <UIForm ui={ui} />
        {footer ? <Divider /> : null}
        {footer}
      </Stack>
    </Container>
  );
}
