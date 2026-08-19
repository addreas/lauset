import { page } from "fresh";
import { define } from "@/lib/fresh.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/sessions.ts
export const handler = define.handlers({
  GET(ctx) {
    const session = ctx.state.session!;

    return page({ session });
  },
});

export default define.page<typeof handler>(({ data }) => {
  const session = data.session;
  const identityCredentialTrait = session?.identity?.traits?.email ||
    session?.identity?.traits?.username ||
    "";

  return (
    <div class="stack">
      <div class="card">
        <h1>Session Information</h1>
        <p>
          Your browser holds an active Ory Session
          {identityCredentialTrait
            ? ` and you are currently logged in as ${identityCredentialTrait}`
            : ""}
          . Changing properties inside Account Settings will be reflected in the
          decoded Ory Session.
        </p>

        <table>
          <tbody>
            <tr>
              <td>ID</td>
              <td>
                <code>{session?.identity?.id}</code>
              </td>
            </tr>
            {Object.entries(session?.identity?.traits ?? {}).map(
              ([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </td>
                </tr>
              ),
            )}
            <tr>
              <td>Signup date</td>
              <td>
                {session?.identity?.created_at
                  ? new Date(session.identity.created_at).toUTCString()
                  : ""}
              </td>
            </tr>
            <tr>
              <td>Authentication level</td>
              <td>
                {session?.authenticator_assurance_level === "aal2"
                  ? "two-factor used (aal2)"
                  : "single-factor used (aal1)"}
              </td>
            </tr>
            {session?.expires_at && (
              <tr>
                <td>Session expires at</td>
                <td>{new Date(session.expires_at).toUTCString()}</td>
              </tr>
            )}
            {session?.authenticated_at && (
              <tr>
                <td>Session authenticated at</td>
                <td>{new Date(session.authenticated_at).toUTCString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {session?.authentication_methods &&
        session.authentication_methods.length > 0 && (
        <div class="card">
          <h2>Authentication Methods</h2>
          <table>
            <tbody>
              {session.authentication_methods.map((method, i) => (
                <tr key={i}>
                  <td>Authentication method used</td>
                  <td>
                    {method.method}
                    {method.completed_at
                      ? ` (${new Date(method.completed_at).toUTCString()})`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div class="card">
        <h2>Raw Session Data</h2>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
    </div>
  );
});
