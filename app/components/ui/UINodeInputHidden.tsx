import { Input } from "@chakra-ui/react";
import { UiNode, UiNodeInputAttributes } from "@ory/client";

export function UINodeInputHidden(
  props: { attributes: UiNodeInputAttributes } & UiNode
) {
  const { attributes, messages } = props;
  return (
    <Input
      name={attributes.name}
      type="hidden"
      value={attributes.value}
      readOnly
    />
  );
}
