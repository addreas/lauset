import {
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  PinInput,
  PinInputField,
} from "@chakra-ui/react";
import { getNodeLabel } from "@ory/integrations/ui";
import { UiNode, UiNodeInputAttributes } from "@ory/client";
import { range } from "lodash";
import { useEffect, useState } from "react";
import { Messages } from "../Messages";

export function UINodeInputTotp(
  props: { attributes: UiNodeInputAttributes } & UiNode
) {
  const { attributes, messages } = props;

  const [value, setValue] = useState("");

  const [interactiveMode, setInteractiveMode] = useState(false);

  useEffect(() => {
    setInteractiveMode(true);
  }, []);

  return (
    <FormControl
      isRequired={attributes.required}
      isDisabled={attributes.disabled}
    >
      <FormLabel>{getNodeLabel(props)}</FormLabel>

      {interactiveMode ? (
        <>
          <HStack>
            <PinInput otp value={value} onChange={setValue}>
              {range(0, 6).map((i) => (
                <PinInputField key={i} />
              ))}
            </PinInput>
          </HStack>

          <input
            type="hidden"
            name={attributes.name}
            id={attributes.name}
            value={value}
            placeholder={getNodeLabel(props)}
          />
        </>
      ) : (
        <Input
          type="text"
          autoComplete="one-time-code"
          name={attributes.name}
          id={attributes.name}
          value={value}
          placeholder={getNodeLabel(props)}
        />
      )}

      <FormHelperText>
        <Messages messages={messages} />
      </FormHelperText>
    </FormControl>
  );
}
