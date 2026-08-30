import { define } from "@/lib/fresh.ts";

export default define.layout(({ Component }) => {
  return (
    <div class="admin stack gap-xl">
      <header class="page-header hstack">
        <h1>Admin</h1>
      </header>
      <nav class="hstack">
        <a class="button" href="/admin/identities">Identities</a>
        <a class="button" href="/admin/clients">Clients</a>
        <a class="button" href="/admin/messages">Messages</a>
      </nav>
      <Component />
    </div>
  );
});
