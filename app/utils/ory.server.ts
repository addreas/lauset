import {
  OAuth2Api,
  JwkApi,
  OidcApi,
  MetadataApi,
  WellknownApi,
  Configuration as HydraConfiguration,
} from "@ory/hydra-client";
import {
  Configuration as KratosConfiguration,
  V0alpha2Api,
} from "@ory/kratos-client";
import { env } from "~/config.server";

export const kratosPublicUrl = env.KRATOS_PUBLIC_URL;
export const kratosBrowserUrl = env.KRATOS_BROWSER_URL;

export const kratosSdk = new V0alpha2Api(
  new KratosConfiguration({
    basePath: kratosPublicUrl,
  })
);

export const hydraAdminUrl = env.HYDRA_ADMIN_URL;
const hydraConf = new HydraConfiguration({
  basePath: hydraAdminUrl,
});
export const hydraOauthApi = new OAuth2Api(hydraConf);

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
