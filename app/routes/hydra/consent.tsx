import {
  Button,
  Checkbox,
  Container,
  FormControl,
  Heading,
  Image,
  ListItem,
  Stack,
  Text,
  UnorderedList,
  useColorModeValue,
} from "@chakra-ui/react";
import { OAuth2Client } from "@ory/hydra-client";
import { Session } from "@ory/client";
import { Form, useLoaderData } from "@remix-run/react";
import {
  ActionFunction,
  LoaderFunction,
  redirect,
} from "@remix-run/server-runtime";
import { Link } from "~/components/Link";
import { hydraOauthApi } from "~/utils/ory.server";

type ViewData = {
  challenge: string;
  requested_scope: string[];
  user: string;
  client: OAuth2Client;
};

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams;
  // Parses the URL query
  // The challenge is used to fetch information about the consent request from ORY Hydra.
  const challenge = params.get("consent_challenge");

  if (!challenge) {
    throw new Error("Expected consent_challenge to be set.");
  }

  const { data: body } = await hydraOauthApi.getOAuth2ConsentRequest(challenge);

  const context = body.context as Session;

  // If a user has granted this application the requested scope, hydra will tell us to not show the UI.
  if (body.skip) {
    // You can apply logic here, for example grant another scope, or do whatever...
    // All we need to do now is to redirect the user back to hydra!
    const {
      data: { redirect_to },
    } = await hydraOauthApi.acceptOAuth2ConsentRequest(challenge, {
      // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
      // are requested accidentally.
      grant_scope: body.requested_scope,

      // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
      grant_access_token_audience: body.requested_access_token_audience,

      // The session allows us to set session data for id and access tokens. Let's add the email if it is included.
      session: createHydraSession(body.requested_scope, context),
    });
    return redirect(redirect_to);
  }

  // If consent can't be skipped we MUST show the consent UI.
  return {
    challenge: challenge,
    // We have a bunch of data available from the response, check out the API docs to find what these values mean
    // and what additional data you have available.
    requested_scope: body.requested_scope,
    user: context.identity.verifiable_addresses?.[0].value,
    client: body.client,
  } as ViewData;
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const challenge = form.get("challenge")?.toString();

  if (!challenge) {
    throw new Error("missing challenge in consent action");
  }

  // Let's see if the user decided to accept or reject the consent request..
  if (form.get("submit") !== "accept") {
    // Looks like the consent request was denied by the user
    const {
      data: { redirect_to },
    } = await hydraOauthApi.rejectOAuth2ConsentRequest(challenge, {
      error: "access_denied",
      error_description: "The resource owner denied the request",
    });
    return redirect(redirect_to);
  }

  let grantScope = form.getAll("grant_scope") as string[] | null;
  if (!grantScope || grantScope.length === 0) {
    throw new Error("missing grant_scope in consent action");
  }

  // Seems like the user authenticated! Let's tell hydra...
  const { data: body } = await hydraOauthApi.getOAuth2ConsentRequest(challenge);

  const {
    data: { redirect_to },
  } = await hydraOauthApi.acceptOAuth2ConsentRequest(challenge, {
    // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
    // are requested accidentally.
    grant_scope: grantScope,

    // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
    grant_access_token_audience: body.requested_access_token_audience,

    // This tells hydra to remember this consent request and allow the same client to request the same
    // scopes from the same user, without showing the UI, in the future.
    remember: Boolean(form.get("remember")),

    // When this "remember" sesion expires, in seconds. Set this to 0 so it will never expire.
    remember_for: 0,

    // The session allows us to set session data for id and access tokens. Let's add the email if it is included.
    session: createHydraSession(body.requested_scope, body.context as Session),
  });

  // All we need to do now is to redirect the user back to hydra!
  return redirect(redirect_to);
};

/*
{
  id: '41398353-419f-4bb9-b2c2-e2a06c51124d',
  active: true,
  expires_at: '2022-01-29T21:05:35.402963711Z',
  authenticated_at: '2022-01-28T21:05:35.402963711Z',
  authenticator_assurance_level: 'aal1',
  authentication_methods: [
    {
      method: 'password',
      completed_at: '2022-01-28T20:53:00.664152109Z'
    },
    {
      method: 'password',
      completed_at: '2022-01-28T21:05:35.402961808Z'
    }
  ],
  issued_at: '2022-01-28T21:05:35.402963711Z',
  identity: {
    id: 'ccb7f3ad-6547-4e9a-be44-08be31c279c0',
    schema_id: 'default',
    schema_url: 'http://localhost:4433/schemas/default',
    state: 'active',
    state_changed_at: '2022-01-28T18:15:47.82151471Z',
    traits: { email: 'andreas@addem.se', name: [Object] },
    verifiable_addresses: [ {
      id: 'c17a9686-bebf-4df2-ba87-5d6acc9424a7',
      value: 'andreas@addem.se',
      verified: true,
      via: 'email',
      status: 'completed',
      verified_at: '2022-01-28T18:16:11.354904678Z',
      created_at: '2022-01-28T18:15:47.823652Z',
      updated_at: '2022-01-28T18:15:47.823652Z'
    } ],
    recovery_addresses: [ [Object] ],
    created_at: '2022-01-28T18:15:47.82292Z',
    updated_at: '2022-01-28T18:15:47.82292Z'
  }
}
*/

const createHydraSession = (
  requestedScope: string[] = [],
  context: Session
) => {
  const verifiableAddresses = context.identity.verifiable_addresses || [];
  if (
    requestedScope.indexOf("email") === -1 ||
    verifiableAddresses.length === 0
  ) {
    return {
      id_token: {},
    };
  }

  return {
    // This data will be available when introspecting the token. Try to avoid sensitive information here,
    // unless you limit who can introspect tokens. (Therefore the scope-check above)
    // access_token: { foo: 'bar' },

    // This data will be available in the ID token.
    // Most services need email-addresses, so let's include that.
    id_token: {
      email: verifiableAddresses[0].value,
    },
  };
};

export default function Consent() {
  const { challenge, client, user, requested_scope } =
    useLoaderData<ViewData>();
  return (
    <Container
      maxW="container.lg"
      bg={useColorModeValue("white", "gray.800")}
      borderRadius="lg"
      boxShadow="lg"
      p={6}
    >
      <Stack>
        <Heading>An application requests access to your data!</Heading>
        <Form reloadDocument method="post">
          <input type="hidden" name="challenge" value={challenge} />
          {client.logo_uri && <Image src={client.logo_uri} />}
          <Text>
            Hi {user}, application{" "}
            <Text as="strong">{client.client_name ?? client.client_id}</Text>{" "}
            wants access resources on your behalf and to:
          </Text>
          <FormControl>
            <Stack>
              {requested_scope.map((scope) => (
                <Checkbox
                  name="grant_scope"
                  id={scope}
                  value={scope}
                  defaultChecked
                >
                  {scope}
                </Checkbox>
              ))}
            </Stack>
          </FormControl>

          <UnorderedList>
            {client.policy_uri && (
              <ListItem>
                <Link href={client.policy_uri}>Policy</Link>
              </ListItem>
            )}
            {client.tos_uri && (
              <ListItem>
                <Link href={client.tos_uri}>Terms of Service</Link>
              </ListItem>
            )}
          </UnorderedList>

          <Text>
            Do you want to be asked next time when this application wants to
            access your data? The application will not be able to ask for more
            permissions without your consent.
          </Text>

          <Stack>
            <Checkbox name="remember" id="remember" value="1">
              Do not ask me again
            </Checkbox>

            <Button type="submit" name="submit" value="accept">
              Allow access
            </Button>
            <Button type="submit" name="submit" value="reject">
              Deny access
            </Button>
          </Stack>
        </Form>
      </Stack>
    </Container>
  );
}
