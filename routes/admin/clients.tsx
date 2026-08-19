import ConfirmButton from "@/islands/ConfirmButton.tsx";
import { define } from "@/lib/fresh.ts";
import { page } from "fresh";
import { oauth2 } from "@/lib/sdk/index.ts";

export const handler = define.handlers({
  async GET() {
    const clients = await oauth2.listOAuth2Clients({ pageSize: 250 });
    return page({ clients, truncated: clients.length >= 250 });
  },
});

function fmtDate(d?: Date | string | null): string {
  return d ? new Date(d).toUTCString() : "";
}

export default define.page<typeof handler>(({ data }) => (
  <div class="stack gap-xl">
    {data.truncated && <p class="admin-note">Showing first 250 clients.</p>}
    {data.clients.map((c) => (
      <div class="card stack gap-lg" key={c.client_id ?? ""}>
        <h2>{c.client_name || c.client_id}</h2>
        <table>
          <tbody>
            <tr>
              <td>client_id</td>
              <td>
                <code>{c.client_id}</code>
              </td>
            </tr>
            <tr>
              <td>client_name</td>
              <td>{c.client_name ?? "—"}</td>
            </tr>
            <tr>
              <td>scope</td>
              <td>{c.scope ?? ""}</td>
            </tr>
            <tr>
              <td>created_at</td>
              <td>{fmtDate(c.created_at)}</td>
            </tr>
          </tbody>
        </table>
        <div class="hstack" style={{ justifyContent: "flex-end" }}>
          <ConfirmButton
            action={`/admin/clients/${c.client_id}`}
            label="Delete"
            variant="danger"
          />
        </div>
      </div>
    ))}
  </div>
));
