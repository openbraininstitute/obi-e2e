/** Errors an HTTP call can fail with. */

import { TaggedError } from 'better-result';

export class NetworkError extends TaggedError('NetworkError')<{
  url: string;
  message: string;
  cause: unknown;
}> {}

export class HttpError extends TaggedError('HttpError')<{
  url: string;
  status: number;
  body: string;
  message: string;
}> {}

export class ParseError extends TaggedError('ParseError')<{
  url: string;
  message: string;
  cause: unknown;
}> {}

export type RequestError = NetworkError | HttpError | ParseError;

/** Turns an error into one short line for a test message. */
export function describe(error: RequestError): string {
  return error.match({
    NetworkError: (e) => `unreachable (${e.message})`,
    HttpError: (e) => `HTTP ${e.status}${e.body ? ` ${e.body.slice(0, 120)}` : ''}`,
    ParseError: (e) => `bad response (${e.message})`,
  });
}
