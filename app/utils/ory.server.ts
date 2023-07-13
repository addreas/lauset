import { Configuration, FrontendApi, OAuth2Api } from "@ory/client";
import { env } from "~/config.server";

export const kratosPublicUrl = env.KRATOS_PUBLIC_URL;
export const kratosBrowserUrl = env.KRATOS_BROWSER_URL;

export const kratosFrontendApi = new FrontendApi(
  new Configuration({ basePath: kratosPublicUrl })
);

export const hydraAdminUrl = env.HYDRA_ADMIN_URL;
export const hydraOauthApi = new OAuth2Api(
  new Configuration({ basePath: hydraAdminUrl })
);

// https://github.com/ory/kratos-selfservice-ui-node/blob/29b716c0b866dd70c9f6d7db5aa79b33b0242947/src/pkg/index.ts
export function getUrlForKratosFlow(
  base: string,
  flow: string,
  query?: URLSearchParams
) {
  return `${removeTrailingSlash(base)}/self-service/${flow}/browser${
    query ? `?${query.toString()}` : ""
  }`;
}

function removeTrailingSlash(s: string) {
  return s.replace(/\/$/, "");
}
