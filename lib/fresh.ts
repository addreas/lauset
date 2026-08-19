import { createDefine } from "fresh";
import type { Session } from "@ory/client-fetch";

export interface State {
  session?: Session;
  locale: string;

  userInfo?: {
    gravatarHash: string;
    userFullName: string;
  };
}

export const define = createDefine<State>();
