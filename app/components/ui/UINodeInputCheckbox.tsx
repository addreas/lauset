import { Checkbox, FormControl, FormHelperText } from "@chakra-ui/react";
import { getNodeLabel } from "@ory/integrations/ui";
import { UiNode, UiNodeInputAttributes } from "@ory/client";
import { Messages } from "../Messages";

export function UINodeInputCheckbox(
  props: { attributes: UiNodeInputAttributes } & UiNode
) {
  const { attributes, messages } = props;
  return (
    <FormControl
      isDisabled={attributes.disabled}
      isRequired={attributes.required}
    >
      <Checkbox
        name={attributes.name}
        id={attributes.name}
        value="true"
        defaultChecked
      >
        {getNodeLabel(props)}
      </Checkbox>

      <FormHelperText>
        <Messages messages={messages} />
      </FormHelperText>
    </FormControl>
  );
}
