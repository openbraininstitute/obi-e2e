import { TaggedError } from 'better-result';

/** The request never reached the service, or the connection failed. */
export class NetworkError extends TaggedError('NetworkError')<{
  url: string;
  message: string;
  cause: unknown;
}> {}

/** The service answered, but not with success. */
export class HttpError extends TaggedError('HttpError')<{
  url: string;
  status: number;
  body: string;
  message: string;
}> {}

/** The response was not the JSON the caller expected. */
export class ParseError extends TaggedError('ParseError')<{
  url: string;
  message: string;
  cause: unknown;
}> {}

export type RequestError = NetworkError | HttpError | ParseError;

/** One line, safe to put in a failure message. */
export function describe(error: RequestError): string {
  return error.match({
    NetworkError: (e) => `unreachable (${e.message})`,
    HttpError: (e) => `HTTP ${e.status}${e.body ? ` ${e.body.slice(0, 120)}` : ''}`,
    ParseError: (e) => `bad response (${e.message})`,
  });
}
