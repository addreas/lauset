import {
  IntlProvider,
  UserLogoutCard,
  UserLogoutCardProps,
} from "@ory/elements-preact";

export default function OryLogoutCard({
  locale,
  ...props
}: Omit<UserLogoutCardProps, "csrfToken" | "action"> & { locale: string }) {
  return (
    <IntlProvider locale={locale}>
      <UserLogoutCard
        {...props}
        csrfToken=""
        action="logout"
        className="ory-user-logout-card"
      />
    </IntlProvider>
  );
}
