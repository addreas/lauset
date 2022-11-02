import { Stack } from "@chakra-ui/react";
import {
  filterNodesByGroups,
  isUiNodeAnchorAttributes,
  isUiNodeImageAttributes,
  isUiNodeInputAttributes,
  isUiNodeScriptAttributes,
  isUiNodeTextAttributes,
} from "@ory/integrations/ui";
import { UiContainer, UiNode, UiNodeInputAttributes } from "@ory/client";
import { groupBy } from "lodash";
import { UINodeAnchor } from "./UINodeAnchor";
import { UINodeImage } from "./UINodeImage";
import { UINodeInputButton } from "./UINodeInputButton";
import { UINodeInputCheckbox } from "./UINodeInputCheckbox";
import { UINodeInputDefault } from "./UINodeInputDefault";
import { UINodeInputHidden } from "./UINodeInputHidden";
import { UINodeInputTotp } from "./UINodeInputTotp";
import { UINodeScript } from "./UINodeScript";
import { UINodeText } from "./UINodeText";

export function UIForm({
  ui,
  groups,
  before,
  after,
  showEmpty,
}: {
  ui: UiContainer;
  groups?: string[];
  before?: JSX.Element;
  after?: JSX.Element;
  showEmpty?: boolean;
}) {
  const filteredNodes = filterNodesByGroups({
    nodes: ui.nodes,
    groups,
    withoutDefaultGroup: true,
  });

  const exists = filteredNodes.length > 0;
  if (!exists && !showEmpty) {
    return null;
  }

  return (
    <Stack>
      {before}
      {Object.values(groupBy(filteredNodes, (n) => n.group)).map((nodes, i) => (
        <form key={i} action={ui.action} method={ui.method}>
          <Stack>
            {ui.nodes
              .filter((n) => n.group === "default")
              .map((node) => (
                <UINode key={getKey(node)} node={node} />
              ))}
            {nodes.map((node) => (
              <UINode key={getKey(node)} node={node} />
            ))}
          </Stack>
        </form>
      ))}
      {after}
    </Stack>
  );
}

function getKey({ attributes }: UiNode) {
  if (isUiNodeAnchorAttributes(attributes)) {
    return attributes.id;
  } else if (isUiNodeImageAttributes(attributes)) {
    return attributes.id;
  } else if (isUiNodeInputAttributes(attributes)) {
    return attributes.name;
  } else if (isUiNodeScriptAttributes(attributes)) {
    return attributes.id;
  } else if (isUiNodeTextAttributes(attributes)) {
    return attributes.id;
  }
}

function UINode({ node: { attributes, ...rest } }: { node: UiNode }) {
  if (isUiNodeAnchorAttributes(attributes)) {
    return <UINodeAnchor attributes={attributes} {...rest} />;
  } else if (isUiNodeImageAttributes(attributes)) {
    return <UINodeImage attributes={attributes} {...rest} />;
  } else if (isUiNodeInputAttributes(attributes)) {
    return (
      <UINodeInput key={attributes.name} attributes={attributes} {...rest} />
    );
  } else if (isUiNodeScriptAttributes(attributes)) {
    return <UINodeScript attributes={attributes} {...rest} />;
  } else if (isUiNodeTextAttributes(attributes)) {
    return <UINodeText attributes={attributes} {...rest} />;
  }

  return <UINodeInputDefault attributes={attributes} {...rest} />;
}

function UINodeInput(props: { attributes: UiNodeInputAttributes } & UiNode) {
  const key = props.attributes.name;

  if (
    props.attributes.name === "totp_code" &&
    props.attributes.node_type === "input" &&
    props.attributes.type === "text"
  ) {
    return <UINodeInputTotp key={key} {...props} />;
  }

  switch (props.attributes.type) {
    case "hidden":
      return <UINodeInputHidden key={key} {...props} />;
    case "submit":
      return <UINodeInputButton key={key} {...props} />;
    case "button":
      return <UINodeInputButton key={key} {...props} />;
    case "checkbox":
      return <UINodeInputCheckbox key={key} {...props} />;
    default: {
      return <UINodeInputDefault key={key} {...props} />;
    }
  }
}
