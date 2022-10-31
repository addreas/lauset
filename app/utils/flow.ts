import { redirect } from "@remix-run/server-runtime";
import { getUrlForKratosFlow, kratosBrowserUrl } from "./ory.server";

// TODO: https://github.com/ory/kratos-selfservice-ui-node/blob/153b6516497456b376ea5c24e6bfe023c965a982/src/pkg/middleware.ts

export async function getFlowOrRedirectToInit<T>(
  request: Request,
  name: string,
  flowGetter: (flow: string, cookie: string) => Promise<{ data: T }>,
  redirectHeaders?: HeadersInit
): Promise<T> {
  const params = new URL(request.url).searchParams;
  const flow = params.get("flow");
  const return_to = params.get("return_to") ?? "";

  const initFlowUrl = getUrlForKratosFlow(
    kratosBrowserUrl,
    name,
    new URLSearchParams({
      return_to: return_to.toString(),
    })
  );
  const initFlowResponse = redirect(initFlowUrl, {
    status: 303,
    headers: redirectHeaders,
  });

  if (!flow) {
    throw initFlowResponse;
  } else {
    try {
      const { data } = await flowGetter(flow, request.headers.get("Cookie")!);

      return data;
    } catch (e: any) {
      if (
        e.response &&
        (e.response.status === 404 ||
          e.response.status === 410 ||
          e.response.status === 403)
      ) {
        throw initFlowResponse;
      }

      throw e;
    }
  }
}
