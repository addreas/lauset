import { ComponentProps, forwardRef } from "react";
import { Link as ChakraLink } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";

export const Link = forwardRef<
  HTMLAnchorElement,
  ComponentProps<typeof ChakraLink>
>((props, ref) => {
  if ("href" in props) {
    return <ChakraLink href={props.href} ref={ref} {...props} />;
  } else if ("to" in props) {
    return (
      <ChakraLink
        ref={ref}
        as={forwardRef((p, ref) => (
          <RemixLink ref={ref as any} {...p} to={props.to} />
        ))}
        {...props}
      />
    );
  } else {
    throw new Error("must specify either `href` or `to` in <Link />");
  }
});
