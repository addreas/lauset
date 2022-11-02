import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { getNodeLabel } from "@ory/integrations/ui";
import { UiNode, UiNodeInputAttributes } from "@ory/client";
import { useState } from "react";
import { Messages } from "../Messages";

export function UINodeInputPassword(
  props: { attributes: UiNodeInputAttributes } & UiNode
) {
  const { attributes, messages } = props;
  const [currentlyVisible, setVisible] = useState(false);

  return (
    <FormControl
      isRequired={attributes.required}
      isDisabled={attributes.disabled}
    >
      <FormLabel>{getNodeLabel(props)}</FormLabel>

      <InputGroup>
        <Input
          name={attributes.name}
          id={attributes.name}
          // type={attributes.type}
          value={attributes.value}
          type={currentlyVisible ? "text" : "password"}
          placeholder={getNodeLabel(props)}
          onClick={() =>
            attributes.onclick
              ? confirm(`evaluate this script? \n\n${attributes.onclick}`) &&
                eval(attributes.onclick)
              : null
          }
        />
        <InputRightElement width="4.5rem">
          <Button onClick={() => setVisible(!currentlyVisible)}>
            {currentlyVisible ? <ViewOffIcon /> : <ViewIcon />}
          </Button>
        </InputRightElement>
      </InputGroup>
      <Input />

      <FormHelperText>
        <Messages messages={messages} />
      </FormHelperText>
    </FormControl>
  );
}
