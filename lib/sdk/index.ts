// Copyright © 2022 Ory Corp
// SPDX-License-Identifier: Apache-2.0
import {
  Configuration,
  CourierApi,
  FrontendApi,
  IdentityApi,
  OAuth2Api,
} from "@ory/client-fetch";

const baseUrlInternal = Deno.env.get("ORY_SDK_URL") ||
  "https://playground.projects.oryapis.com";

const apiBaseFrontendUrlInternal = Deno.env.get("KRATOS_PUBLIC_URL") ||
  baseUrlInternal;

const apiBaseKratosAdminUrlInternal = Deno.env.get("KRATOS_ADMIN_URL");
if (!apiBaseKratosAdminUrlInternal) {
  throw new Error("KRATOS_ADMIN_URL is not set");
}

const apiBaseOauth2UrlInternal = Deno.env.get("HYDRA_ADMIN_URL") ||
  baseUrlInternal;

const adminToken = Deno.env.get("ORY_ADMIN_API_TOKEN");
const mockTlsTermination = Deno.env.get("MOCK_TLS_TERMINATION");

export const apiBaseUrl = Deno.env.get("KRATOS_BROWSER_URL") ||
  apiBaseFrontendUrlInternal;

export const frontend = new FrontendApi(
  new Configuration({ basePath: apiBaseFrontendUrlInternal }),
);

// Admin APIs share the Kratos/Hydra admin token (and the mock TLS header used
// behind a terminating proxy). See `ORY_ADMIN_API_TOKEN` / `MOCK_TLS_TERMINATION`.
const adminConfig = (basePath: string) =>
  new Configuration({
    basePath,
    ...(adminToken && { accessToken: adminToken }),
    ...(mockTlsTermination && {
      baseOptions: { "X-Forwarded-Proto": "https" },
    }),
  });

export const identity = new IdentityApi(
  adminConfig(apiBaseKratosAdminUrlInternal),
);

export const courier = new CourierApi(
  adminConfig(apiBaseKratosAdminUrlInternal),
);

export const oauth2 = new OAuth2Api(
  adminConfig(apiBaseOauth2UrlInternal),
);
