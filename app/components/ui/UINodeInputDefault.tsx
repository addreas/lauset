import {
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { getNodeLabel } from "@ory/integrations/ui";
import { UiNode, UiNodeInputAttributes } from "@ory/client";
import { Messages } from "../Messages";

export function UINodeInputDefault(
  props: { attributes: UiNodeInputAttributes } & UiNode
) {
  const { attributes, messages } = props;
  return (
    <FormControl
      isRequired={attributes.required}
      isDisabled={attributes.disabled}
    >
      <FormLabel>{getNodeLabel(props)}</FormLabel>

      <Input
        name={attributes.name}
        id={attributes.name}
        type={attributes.type}
        defaultValue={attributes.value}
        placeholder={getNodeLabel(props)}
      />

      <FormHelperText>
        <Messages messages={messages} />
      </FormHelperText>
    </FormControl>
  );
}
