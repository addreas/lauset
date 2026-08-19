import type {
  FlowError as FetchFlowError,
  LoginFlow as FetchLoginFlow,
  OAuth2ConsentRequest as FetchOAuth2ConsentRequest,
  RecoveryFlow as FetchRecoveryFlow,
  RegistrationFlow as FetchRegistrationFlow,
  SettingsFlow as FetchSettingsFlow,
  VerificationFlow as FetchVerificationFlow,
} from "@ory/client-fetch";

export type {
  FetchFlowError,
  FetchLoginFlow,
  FetchRecoveryFlow,
  FetchRegistrationFlow,
  FetchSettingsFlow,
  FetchVerificationFlow,
};
import type {
  FlowError,
  LoginFlow,
  OAuth2ConsentRequest,
  RecoveryFlow,
  RegistrationFlow,
  SettingsFlow,
  VerificationFlow,
} from "@ory/client";

export type {
  FlowError,
  LoginFlow,
  RecoveryFlow,
  RegistrationFlow,
  SettingsFlow,
  VerificationFlow,
};

/**
 * Convert fetch-client models to axios-client models for @ory/elements-preact.
 *
 * The fetch-based `@ory/client-fetch` parses date fields into `Date` objects at
 * runtime (e.g. `Identity.updated_at` is `new Date(json['updated_at'])`), while
 * the older axios-based `@ory/client` (which elements-preact's .d.ts imports)
 * leaves them as ISO strings. `throughJSON` serializes via `JSON.stringify`,
 * which calls `Date#toJSON()` → `toISOString()`, so the round-trip turns every
 * `Date` back into an ISO string matching the axios-client shape.
 */
export function throughJSON<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export function toLoginFlow(f: FetchLoginFlow): LoginFlow {
  return throughJSON(f);
}
export function toRecoveryFlow(f: FetchRecoveryFlow): RecoveryFlow {
  return throughJSON(f);
}
export function toRegistrationFlow(f: FetchRegistrationFlow): RegistrationFlow {
  return throughJSON(f);
}
export function toSettingsFlow(f: FetchSettingsFlow): SettingsFlow {
  return throughJSON(f);
}
export function toVerificationFlow(f: FetchVerificationFlow): VerificationFlow {
  return throughJSON(f);
}
export function toFlowError(f: FetchFlowError): FlowError {
  return throughJSON(f);
}
export function toOAuth2ConsentRequest(
  f: FetchOAuth2ConsentRequest,
): OAuth2ConsentRequest {
  return throughJSON(f);
}
