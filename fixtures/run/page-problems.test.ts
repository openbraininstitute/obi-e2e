import { describe, expect, test } from 'bun:test';

import { BUNDLE_CHANGED, causeOf, taskError } from './page-problems';

const ENTITYCORE = 'https://staging.cell-a.openbraininstitute.org/api/entitycore';
const APP = 'https://main.preview.openbraininstitute.org/app/virtual-lab/lab/project';

describe('causeOf', () => {
  test('names the service the page could not reach, from the 13 Oct listing failure', () => {
    const cause = causeOf([
      'uncaught: Minified React error #419; visit https://react.dev/errors/419',
      `console: Access to fetch at '${ENTITYCORE}/brain-region-hierarchy' from origin 'https://main.preview.openbraininstitute.org' has been blocked by CORS policy`,
      `GET ${ENTITYCORE}/brain-region-hierarchy → net::ERR_FAILED`,
      `GET ${ENTITYCORE}/brain-atlas → net::ERR_FAILED`,
    ]);

    expect(cause).toStartWith(
      'entitycore did not answer GET /brain-region-hierarchy (net::ERR_FAILED; the browser blocked it (CORS)'
    );
  });

  test('names a deploy under the page before the slow calls, from the 16 Oct campaigns', () => {
    const cause = causeOf([
      'slow: POST https://x/api/small-scale-simulator/circuit/simulation/run-batch took 27.5 s',
      'console: Failed to load resource: the server responded with a status of 404 ()',
      'console: ChunkLoadError: Failed to load chunk /_next/static/chunks/0qv201tqcb7rf.js',
      BUNDLE_CHANGED,
    ]);

    expect(cause).toStartWith('The app was redeployed during the test');
  });

  test("puts a task's own error first", () => {
    const cause = causeOf([
      'slow: GET https://x/api/entitycore/cell-morphology took 31.0 s',
      'task error: Task execution failed: 5 validation errors for EModelOptimizationScanConfig',
    ]);

    expect(cause).toBe(
      'The task failed: Task execution failed: 5 validation errors for EModelOptimizationScanConfig'
    );
  });

  test('prefers a 5xx to a slow call, and keeps its reason', () => {
    const cause = causeOf([
      'slow: GET https://x/api/entitycore/cell-morphology took 31.0 s',
      'POST https://x/api/obi-one/declared/task/estimate → 500 {"detail":"boom"}',
    ]);

    expect(cause).toBe('obi-one answered 500 to POST /declared/task/estimate: {"detail":"boom"}');
  });

  test('reports a slow call when nothing failed outright', () => {
    expect(causeOf(['slow: GET https://x/api/entitycore/cell-morphology took 31.0 s'])).toBe(
      'entitycore took 31.0 s to answer GET /cell-morphology'
    );
  });

  test('names nothing for what a healthy run has too', () => {
    expect(
      causeOf([
        'uncaught: Minified React error #419',
        `GET ${APP}/help?_rsc=abc → net::ERR_ABORTED`,
        'GET https://x/api/entitycore/cell-morphology/abc → 404 {"detail":"not found"}',
        'console: Failed to load resource: net::ERR_FAILED',
      ])
    ).toBeUndefined();
  });
});

describe('taskError', () => {
  test('reads the error a task logged, with the lines that say which', () => {
    const stream = [
      '{"message_type":"log","level":"INFO","message":"Task is now running"}',
      '{"message_type":"log","level":"ERROR","message":"Task execution failed: 5 validation errors\\ninitialize.target_efeatures\\n  Field required\\n    For further information visit https://errors.pydantic.dev"}',
      '{"message_type":"status","status":"error"}',
    ].join('\n');

    expect(taskError(stream)).toBe(
      'Task execution failed: 5 validation errors · initialize.target_efeatures · Field required'
    );
  });

  test('reads it from a task record too, and finds nothing in a healthy one', () => {
    const failed = { status: 'error', logs: [{ level: 'ERROR', message: 'Out of memory' }] };
    expect(taskError(JSON.stringify(failed))).toBe('Out of memory');
    expect(taskError(JSON.stringify({ status: 'done', logs: [] }))).toBeUndefined();
  });
});
