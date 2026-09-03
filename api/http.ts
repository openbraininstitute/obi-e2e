import { Result } from 'better-result';

import { HttpError, NetworkError, ParseError, type RequestError } from './errors';

const DEFAULT_TIMEOUT_MS = 15_000;

type Options = RequestInit & { timeoutMs?: number };

/**
 * Every call returns a Result, so a caller has to handle failure before it can
 * reach the value. Nothing here throws.
 */
export async function request(
  url: string,
  options: Options = {}
): Promise<Result<Response, RequestError>> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;

  const response = await Result.tryPromise({
    try: () => fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) }),
    catch: (cause): RequestError => new NetworkError({ url, message: messageOf(cause), cause }),
  });

  if (Result.isError(response)) return response;

  const value = response.value;
  if (!value.ok) {
    const body = await value.text().catch(() => '');
    return Result.err(
      new HttpError({ url, status: value.status, body, message: `HTTP ${value.status}` })
    );
  }

  return Result.ok(value);
}

/** As `request`, then reads the body as JSON. */
export async function requestJson<T>(
  url: string,
  options: Options = {}
): Promise<Result<T, RequestError>> {
  const response = await request(url, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
  });
  if (Result.isError(response)) return response;

  return Result.tryPromise({
    try: () => response.value.json() as Promise<T>,
    catch: (cause): RequestError => new ParseError({ url, message: messageOf(cause), cause }),
  });
}

function messageOf(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return String(cause);
}
