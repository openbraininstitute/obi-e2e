import pino from 'pino';
import pretty from 'pino-pretty';

import { isCI } from './env';

/**
 * One line per thing that happened, readable by a person or by a machine but
 * never by both at once.
 *
 * A run is read two ways. Someone watching a terminal wants a short line they
 * can skim; whatever collects the run afterwards wants a record it can query,
 * where the lab a run used and the credits it started with are fields rather
 * than words inside a sentence. So the same call writes either, and the choice
 * is made once for the run instead of at every call site.
 *
 * pino writes the machine half, in the shape log collectors already expect.
 * pino-pretty writes the human half — as a plain stream rather than through
 * `pino.transport`, which starts a worker thread: Playwright already runs these
 * in worker processes, and a transport inside one is a thread that can outlive
 * the test that started it and swallow its last lines.
 */
export const LOG_FORMATS = ['text', 'json'] as const;
export type LogFormat = (typeof LOG_FORMATS)[number];

/**
 * `text` for a person, `json` for whatever reads the run afterwards. CI takes
 * json because its output is archived and searched; a terminal takes text.
 *
 * @throws Error when `E2E_LOG_FORMAT` names a format that does not exist.
 */
export function logFormat(): LogFormat {
  const declared = process.env.E2E_LOG_FORMAT;
  if (!declared) return isCI ? 'json' : 'text';

  if (!LOG_FORMATS.includes(declared as LogFormat)) {
    throw new Error(`E2E_LOG_FORMAT must be one of ${LOG_FORMATS.join(', ')}, got "${declared}".`);
  }
  return declared as LogFormat;
}

function stream(): NodeJS.WritableStream {
  if (logFormat() === 'json') return process.stdout;

  return pretty({
    colorize: !isCI,
    // The date is the run's, not the line's, and whoever is watching a terminal
    // already knows which day it is.
    translateTime: 'HH:MM:ss',
    // Which worker wrote a line only matters when untangling a parallel run
    // from an archive, so it stays in the record and off the screen.
    ignore: 'pid,hostname,worker',
    // Fields indented under the message rather than crammed beside it. The
    // record that matters most — the one naming the lab, the project and the
    // budget — is also the longest, and on one line it is unreadable.
  });
}

export const log = pino(
  {
    level: process.env.E2E_LOG_LEVEL ?? 'info',
    // ISO rather than epoch milliseconds, so a record is legible without being
    // parsed and two runs sort without arithmetic.
    timestamp: pino.stdTimeFunctions.isoTime,
    // "info" rather than 30. The record is read by people as often as by
    // machines, and every collector accepts a string level.
    formatters: { level: (label) => ({ level: label }) },
    // pino stamps every line with pid and hostname. Only the worker matters
    // here, and only when a parallel run needs untangling.
    base: { worker: process.pid },
  },
  stream()
);
