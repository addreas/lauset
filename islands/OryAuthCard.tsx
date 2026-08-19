import {
  IntlProvider,
  UserAuthCard,
  UserAuthCardProps,
} from "@ory/elements-preact";
import "./OryAuthCard.css";

export default function OryAuthCard(
  { locale, ...props }: UserAuthCardProps & { locale: string },
) {
  return (
    <IntlProvider locale={locale}>
      <UserAuthCard {...props} includeScripts className="ory-user-auth-card" />
    </IntlProvider>
  );
}
