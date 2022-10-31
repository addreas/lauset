import { Center, Image } from "@chakra-ui/react";
import { getNodeLabel } from "@ory/integrations/ui";
import { UiNode, UiNodeImageAttributes } from "@ory/client";

export function UINodeImage(
  props: { attributes: UiNodeImageAttributes } & UiNode
) {
  const { attributes } = props;
  return (
    <Center p={5}>
      <Image
        src={attributes.src}
        width={attributes.width}
        height={attributes.height}
        alt={getNodeLabel(props)}
      />
    </Center>
  );
}
