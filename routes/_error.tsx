import { HttpError, type PageProps } from "fresh";
import {
  backUrlFromReq,
  ErrorCard,
  httpError,
  internalServerError,
} from "@/components/error.tsx";

export default async function ErrorPage({ error, req }: PageProps) {
  // HttpErrors keep their real status (404, 403, ...); anything else is a
  // genuine unhandled exception, reported as a 500 with debug info.
  const isHttp = error instanceof HttpError;
  const flowError = isHttp
    ? httpError(error.status, error.message)
    : await internalServerError(error);
  const title = isHttp
    ? `${error.status} - ${error.message}`
    : "Internal Server Error";

  return (
    <ErrorCard title={title} error={flowError} backUrl={backUrlFromReq(req)} />
  );
}
