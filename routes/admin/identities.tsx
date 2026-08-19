import ConfirmButton from "@/islands/ConfirmButton.tsx";
import RecoveryButton from "@/islands/RecoveryButton.tsx";
import { define } from "@/lib/fresh.ts";
import { page } from "fresh";
import { identity } from "@/lib/sdk/index.ts";
import type { Identity, Session } from "@ory/client-fetch";

interface IdentityRow {
  identity: Identity;
  sessions: Session[];
}

export const handler = define.handlers({
  async GET() {
    const identities = await identity.listIdentities({ pageSize: 250 });
    const rows: IdentityRow[] = await Promise.all(
      identities.map(async (i) => {
        let sessions: Session[] = [];
        try {
          sessions = await identity.listIdentitySessions({ id: i.id });
        } catch (err) {
          console.debug(`admin: failed to list sessions for ${i.id}`, err);
        }
        return { identity: i, sessions };
      }),
    );
    return page({ rows, truncated: identities.length >= 250 });
  },
});

function fmtDate(d?: Date | string | null): string {
  return d ? new Date(d).toUTCString() : "";
}

export default define.page<typeof handler>(({ data }) => (
  <div class="stack gap-xl">
    {data.truncated && <p class="admin-note">Showing first 250 identities.</p>}
    {data.rows.map(({ identity: i, sessions }) => (
      <div class="card stack gap-lg" key={i.id}>
        <h2>{i.verifiable_addresses?.[0]?.value ?? i.id}</h2>
        <table>
          <tbody>
            <tr>
              <td>state</td>
              <td>{i.state ?? "—"}</td>
            </tr>
            <tr>
              <td>email</td>
              <td>{i.verifiable_addresses?.[0]?.value ?? "—"}</td>
            </tr>
            <tr>
              <td>schema</td>
              <td>{i.schema_id}</td>
            </tr>
            <tr>
              <td>created_at</td>
              <td>{fmtDate(i.created_at)}</td>
            </tr>
          </tbody>
        </table>
        <div class="stack">
          <h3>traits</h3>
          {i.traits
            ? <pre>{JSON.stringify(i.traits, null, 2)}</pre>
            : <p class="admin-note">—</p>}
          <form
            class="stack"
            method="post"
            action={`/admin/identities/${i.id}`}
          >
            <input type="hidden" name="action" value="update-metadata" />
            <h3>metadata_admin</h3>
            <textarea name="metadata_admin" rows={4}>
              {i.metadata_admin
                ? JSON.stringify(i.metadata_admin, null, 2)
                : ""}
            </textarea>
            <h3>metadata_public</h3>
            <textarea name="metadata_public" rows={4}>
              {i.metadata_public
                ? JSON.stringify(i.metadata_public, null, 2)
                : ""}
            </textarea>
            <button
              class="button"
              type="submit"
              style={{ alignSelf: "flex-end" }}
            >
              Save metadata
            </button>
          </form>
        </div>
        <div class="stack">
          <h3>Sessions ({sessions.length})</h3>
          {sessions.length === 0
            ? <p class="admin-note">No sessions.</p>
            : (
              <table>
                <thead>
                  <tr>
                    <th>IP</th>
                    <th>authenticated</th>
                    <th>expires</th>
                    <th>active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.devices?.[0]?.ip_address ?? "—"}</td>
                      <td>{fmtDate(s.authenticated_at)}</td>
                      <td>{fmtDate(s.expires_at)}</td>
                      <td>{s.active ? "yes" : "no"}</td>
                      <td>
                        <ConfirmButton
                          action={`/admin/identities/${i.id}`}
                          fields={{
                            action: "disable-session",
                            sessionId: s.id,
                          }}
                          label="Sign out"
                          variant="danger"
                          size="mini"
                          disabled={!s.active}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
        <div class="hstack" style={{ justifyContent: "flex-end" }}>
          <RecoveryButton identityId={i.id} kind="link" />
          <RecoveryButton identityId={i.id} kind="code" />
          <ConfirmButton
            action={`/admin/identities/${i.id}`}
            fields={{ action: "sign-out" }}
            label="Sign out all"
            variant="danger"
          />
          <ConfirmButton
            action={`/admin/identities/${i.id}`}
            fields={{ action: "delete" }}
            label="Delete"
            variant="danger"
          />
        </div>
      </div>
    ))}
  </div>
));
