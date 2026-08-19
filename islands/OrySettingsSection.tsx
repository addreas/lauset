import {
  hasLookupSecret,
  hasOidc,
  hasPasskey,
  hasPassword,
  hasProfile,
  hasSaml,
  hasTotp,
  hasWebauthn,
  IntlProvider,
  UserSettingsCard,
} from "@ory/elements-preact";
import type { SettingsFlow } from "@ory/client";
import "./OrySettingsSection.css";

// The settings sections to render, in display order. Sections the flow has no
// content for are dropped by isAvailable.
const ALL_METHODS = [
  "profile",
  "password",
  "oidc",
  "lookup_secret",
  "webauthn",
  "passkey",
  "totp",
] as const;

type SettingsMethod = typeof ALL_METHODS[number];

interface OrySettingsSectionProps {
  flow: SettingsFlow;
  locale: string;
}

// Whether the flow actually has content for a method, so empty sections are
// stripped entirely instead of rendering an empty card. Uses the same `has*`
// helpers UserSettingsCard relies on.
function isAvailable(flow: SettingsFlow, method: SettingsMethod): boolean {
  const nodes = flow.ui.nodes;
  switch (method) {
    case "profile":
      return hasProfile(nodes);
    case "password":
      return hasPassword(nodes);
    case "totp":
      return hasTotp(nodes);
    case "webauthn":
      return hasWebauthn(nodes);
    case "passkey":
      return hasPasskey(nodes);
    case "oidc":
      return hasOidc(nodes) || hasSaml(nodes);
    case "lookup_secret":
      return hasLookupSecret(nodes);
  }
}

export default function OrySettingsSection({
  flow,
  locale,
}: OrySettingsSectionProps) {
  return (
    <IntlProvider locale={locale}>
      <div class="stack gap-lg">
        {ALL_METHODS.filter((method) => isAvailable(flow, method)).map(
          (method) => (
            <div class="ory-settings-section card" key={method}>
              <UserSettingsCard flow={flow} method={method} includeScripts />
            </div>
          ),
        )}
      </div>
    </IntlProvider>
  );
}
