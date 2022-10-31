import { Button } from "@chakra-ui/react";
import { UiNode, UiNodeAnchorAttributes } from "@ory/kratos-client";
import React from "react";
import { Messages } from "../Messages";

export function UINodeAnchor(
  props: { attributes: UiNodeAnchorAttributes } & UiNode
) {
  const { attributes, messages } = props;
  return (
    <Button
      as={React.forwardRef<HTMLButtonElement>((props) => (
        <>
          <a href={attributes.href} {...props}>
            {attributes.title.text}
          </a>
          <Messages messages={messages} />
        </>
      ))}
    />
  );
}
