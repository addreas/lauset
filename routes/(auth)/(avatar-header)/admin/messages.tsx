import { define } from "@/lib/fresh.ts";
import { page } from "fresh";
import { courier } from "@/lib/sdk/index.ts";

export const handler = define.handlers({
  async GET() {
    const messages = await courier.listCourierMessages({ pageSize: 100 });
    return page({ messages, truncated: messages.length >= 100 });
  },
});

function fmtDate(d?: Date | string | null): string {
  return d ? new Date(d).toUTCString() : "";
}

export default define.page<typeof handler>(({ data }) => (
  <div class="stack gap-xl">
    {data.truncated && <p class="admin-note">Showing first 100 messages.</p>}
    {data.messages.map((m) => (
      <div class="card stack gap-lg" key={m.id}>
        <h2>{m.subject ?? m.id}</h2>
        <table>
          <tbody>
            <tr>
              <td>id</td>
              <td>
                <code>{m.id}</code>
              </td>
            </tr>
            <tr>
              <td>status</td>
              <td>{m.status}</td>
            </tr>
            <tr>
              <td>recipient</td>
              <td>{m.recipient}</td>
            </tr>
            <tr>
              <td>subject</td>
              <td>{m.subject}</td>
            </tr>
            <tr>
              <td>created_at</td>
              <td>{fmtDate(m.created_at)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    ))}
  </div>
));
