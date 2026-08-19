import { IntlProvider } from "@ory/elements-preact";
import { define } from "@/lib/fresh.ts";

export default define.layout(({ Component, state }) => {
  return (
    <IntlProvider locale={state.locale}>
      <Component />
    </IntlProvider>
  );
});
