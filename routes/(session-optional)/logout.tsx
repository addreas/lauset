import OryLogoutCard from "@/islands/OryLogoutCard.tsx";
import { page } from "fresh";
import { define } from "@/lib/fresh.ts";
import { oauth2 } from "@/lib/sdk/index.ts";
import { shouldSkipLogoutConsent } from "@/lib/index.ts";

// Reference: https://github.com/ory/kratos-selfservice-ui-node/blob/master/src/routes/logout.ts
export const handler = define.handlers({
  GET(ctx) {
    const logoutChallenge = ctx.url.searchParams.get("logout_challenge");

    if (typeof logoutChallenge !== "string") {
      console.debug("Expected a logout challenge to be set but received none.");
      return ctx.redirect("/login", 302);
    }

    return oauth2
      .getOAuth2LogoutRequest({ logoutChallenge })
      .then(async (body) => {
        if (shouldSkipLogoutConsent(body)) {
          return await oauth2
            .acceptOAuth2LogoutRequest({ logoutChallenge })
            .then((body) => ctx.redirect(body.redirect_to));
        }

        return page({
          challenge: logoutChallenge,
        });
      })
      .catch(() => ctx.redirect("login"));
  },

  async POST(ctx) {
    const form = await ctx.req.formData();

    // The challenge is now a hidden input field, so let's take it from
    // the request body instead.
    const logoutChallenge = form.get("challenge")?.toString()!;
    const submit = form.get("submit")?.toString();

    if (submit === "No") {
      console.debug("User rejected to log out.");
      // The user rejected to log out, so we'll redirect to /ui/welcome
      return oauth2
        .rejectOAuth2LogoutRequest({ logoutChallenge })
        .then(() => ctx.redirect("login"))
        .catch(() => ctx.redirect("login"));
    } else {
      console.debug("User agreed to log out.");
      // The user agreed to log out, let's accept the logout request.
      return oauth2
        .acceptOAuth2LogoutRequest({ logoutChallenge })
        .then((body) => ctx.redirect(body.redirect_to))
        .catch(() => ctx.redirect("login"));
    }
  },
});

export default define.page<typeof handler>(({ data, state }) => (
  <OryLogoutCard challenge={data.challenge} locale={state.locale} />
));
