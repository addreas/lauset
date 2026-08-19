import {
  IntlProvider,
  UserConsentCard,
  UserConsentCardProps,
} from "@ory/elements-preact";
import type { OAuth2ConsentRequest } from "@ory/client";

interface OryConsentCardProps {
  consent: OAuth2ConsentRequest;
  locale: string;
}

export default function OryConsentCard({
  locale,
  ...props
}: Omit<UserConsentCardProps, "csrfToken" | "action"> & { locale: string }) {
  return (
    <IntlProvider locale={locale}>
      <UserConsentCard
        {...props}
        csrfToken=""
        action="consent"
        className="ory-user-consent-card"
      />
    </IntlProvider>
  );
}
