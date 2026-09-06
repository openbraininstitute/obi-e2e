/** Run logger. Readable text on a laptop, JSON in CI. */

import pino from 'pino';
import pretty from 'pino-pretty';

import { isCI } from './env';

export const LOG_FORMATS = ['text', 'json'] as const;
export type LogFormat = (typeof LOG_FORMATS)[number];

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
    translateTime: 'HH:MM:ss',
    ignore: 'pid,hostname,worker',
  });
}

export const log = pino(
  {
    level: process.env.E2E_LOG_LEVEL ?? 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
    base: { worker: process.pid },
  },
  stream()
);
