import { define } from "@/lib/fresh.ts";

export default define.layout(({ Component, state }) => {
  const { gravatarHash, userFullName } = state.userInfo!;

  return (
    <div class="stack gap-xl">
      <header class="page-header hstack">
        <span
          class="avatar avatar-sm"
          title="Change your avatar on gravatar.com"
        >
          <img
            src={`https://www.gravatar.com/avatar/${gravatarHash}.jpg?s=160`}
            alt="Avatar"
            class="avatar avatar-sm"
          />
        </span>
        <h1>
          <a href="/">{userFullName}</a>
        </h1>
      </header>

      <Component />

      <a class="footer-link" href="/">
        Go back
      </a>
    </div>
  );
});
