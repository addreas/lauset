import { page } from "fresh";
import { define } from "@/lib/fresh.ts";
import { frontend } from "@/lib/sdk/index.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/welcome.ts
export const handler = define.handlers({
  async GET(ctx) {
    const return_to = ctx.url.searchParams.get("return_to");

    const logoutUrl = (
      await frontend
        .createBrowserLogoutFlow({
          cookie: ctx.req.headers.get("cookie")!,
          returnTo: (return_to && return_to.toString()) || "",
        })
        .catch(() => ({ logout_url: "" }))
    ).logout_url || "";

    return page({ logoutUrl });
  },
});

export default define.page<typeof handler>(({ data, state }) => {
  const { gravatarHash, userFullName } = state.userInfo!;

  return (
    <div class="stack gap-xl">
      <header class="page-header stack">
        <span
          class="avatar avatar-xl"
          title="Change your avatar on gravatar.com"
        >
          <img
            src={`https://www.gravatar.com/avatar/${gravatarHash}.jpg?s=160`}
            alt="Avatar"
          />
        </span>
        <h1>Welcome, {userFullName}!</h1>
      </header>

      <div class="card">
        <div class="stack">
          <a href="/settings" class="button">
            Manage account settings
          </a>

          <a href="/sessions" class="button">
            Manage sessions
          </a>

          <a href={data.logoutUrl} class="button">
            Logout
          </a>
        </div>
      </div>
    </div>
  );
});
