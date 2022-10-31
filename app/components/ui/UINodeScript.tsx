import { UiNode, UiNodeScriptAttributes } from "@ory/client";
import { HTMLAttributeReferrerPolicy } from "react";

export function UINodeScript({
  attributes,
}: { attributes: UiNodeScriptAttributes } & UiNode) {
  return (
    <script
      src={attributes.src}
      type={attributes.type}
      integrity={attributes.integrity}
      referrerPolicy={attributes.referrerpolicy as HTMLAttributeReferrerPolicy}
      crossOrigin={attributes.crossorigin}
      async={attributes.async}
    />
  );
}
