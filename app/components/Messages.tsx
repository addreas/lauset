import { Alert, AlertIcon, Stack } from "@chakra-ui/react";
import { UiText } from "@ory/client";
import { ComponentProps } from "react";

export function Messages({
  messages,
  alertProps,
}: {
  messages?: UiText[];
  alertProps?: Omit<ComponentProps<typeof Alert>, "children">;
}) {
  if (!messages || !messages.length) return null;

  return (
    <Stack>
      {messages?.map((m) => (
        <Alert
          borderRadius="md"
          key={m.id}
          status={m.type as "success" | "info" | "warning" | "error"}
          {...alertProps}
        >
          <AlertIcon />
          {m.text}
        </Alert>
      ))}
    </Stack>
  );
}

/*
{
  "id": 1010004,
  "text": "Please complete the second authentication challenge.",
  "type": "info",
  "context": {}
}

{
  "id": 4000006,
  "text": "The provided credentials are invalid, check for spelling mistakes in your password or username, email address, or phone number.",
  "type": "error",
  "context": {}
}

{
  "id": 1010003,
  "text": "Please confirm this action by verifying that it is you.",
  "type": "info",
  "context": {}
}

{
  "id": 4000005,
  "text": "The password can not be used because the password is too similar to the user identifier.",
  "type": "error",
  "context": {
    "reason": "the password is too similar to the user identifier"
  }
}

{
  "id": 4000005,
  "text": "The password can not be used because password length must be at least 8 characters but only got 4.",
  "type": "error",
  "context": {
    "reason": "password length must be at least 8 characters but only got 4"
  }
}
*/
