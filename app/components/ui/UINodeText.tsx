import {
  Code,
  Stack,
  Tag,
  Text,
  Tooltip,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { getNodeLabel } from "@ory/integrations/ui";
import { UiNode, UiNodeTextAttributes } from "@ory/client";
import { range } from "lodash";

export function UINodeText(
  props: { attributes: UiNodeTextAttributes } & UiNode
) {
  return (
    <Stack>
      <Text>{getNodeLabel(props)}</Text>
      <Content {...props} />
    </Stack>
  );
}

// TODO: where are these defined? in the kratos identity.schema.json?
const LOOKUP_SECRET_TEXT_ID = 1050015;
const LOOKUP_SECRET_USED_ID = 1050014;

function Content({
  attributes,
}: { attributes: UiNodeTextAttributes } & UiNode) {
  console.log("UINodeText attributes", { attributes });
  switch (attributes.text.id) {
    case LOOKUP_SECRET_TEXT_ID:
      return <LookupSecret {...(attributes.text.context as any)} />;
    default:
      return (
        <Code p={4} borderRadius="md">
          {attributes.text.text}
        </Code>
      );
  }
}

function LookupSecret({
  secrets,
}: {
  secrets: Array<{ id: number; text: string }>;
}) {
  return (
    <Wrap>
      {secrets.map((secret) => (
        <WrapItem>
          {secret.id === LOOKUP_SECRET_USED_ID ? (
            <Tooltip label={secret.text}>
              <Tag colorScheme="red" fontFamily="mono">
                {range(0, 8).map(() => (
                  <>&nbsp;</>
                ))}
              </Tag>
            </Tooltip>
          ) : (
            <Tag colorScheme="green" fontFamily="mono">
              {secret.text}
            </Tag>
          )}
        </WrapItem>
      ))}
    </Wrap>
  );
}
