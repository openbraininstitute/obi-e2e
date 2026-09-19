import { FlaskConical, Globe, type LucideIcon, Rocket } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ChartCard, CreditsBar, Legend, OutcomeDonut } from '@/charts';
import { AnimatedBadge, type AnimatedBadgeStatus } from '@/components/motion/animated-badge';
import { AnimatedNumber } from '@/components/motion/animated-number';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/motion/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/motion/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/motion/tabs';
import {
  duration,
  loadRuns,
  loadScenarioIndex,
  loadSummary,
  passRate,
  percent,
  reportPath,
  runDay,
  runEnvironment,
  runTime,
  type ServiceStatus,
  shortDate,
  type Suite,
  type Summary,
} from '@/data';
import { ScenarioDrawer } from '@/scenario-drawer';

const SERVICE_STATUS: Record<ServiceStatus, AnimatedBadgeStatus> = {
  healthy: 'success',
  down: 'danger',
  skipped: 'neutral',
};

function Tile({
  label,
  value,
  tone,
  format,
}: {
  label: string;
  value: number;
  tone?: string;
  format?: (n: number) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <AnimatedNumber
        value={value}
        format={format}
        duration={0.5}
        startOnView={false}
        className="text-2xl font-semibold tabular-nums"
        {...(tone ? { style: { color: tone } } : {})}
      />
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card overflow-hidden">{children}</div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className ?? ''}`}>{children}</td>;
}

function Overview({ summary }: { summary: Summary }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="Pass rate" value={passRate(summary)} format={(n) => percent.format(n)} />
        <Tile label="Passed" value={summary.passed} tone="var(--pass)" />
        <Tile label="Failed" value={summary.failed} tone={summary.failed ? 'var(--fail)' : ''} />
        <Tile label="Flaky" value={summary.flaky} tone={summary.flaky ? 'var(--flake)' : ''} />
        <Tile label="Skipped" value={summary.skipped} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Outcomes" hint="Every test this run reported.">
          <OutcomeDonut summary={summary} />
          <Legend
            items={[
              { key: 'passed', label: 'passed' },
              { key: 'failed', label: 'failed' },
              { key: 'flaky', label: 'flaky' },
              { key: 'skipped', label: 'skipped' },
            ]}
          />
        </ChartCard>

        {summary.credits?.assigned === undefined ? null : (
          <ChartCard title="Credits" hint="What the project was given, and where it went.">
            <CreditsBar credits={summary.credits} />
            <Legend
              items={[
                { key: 'spent', label: 'spent' },
                { key: 'left', label: 'left' },
              ]}
            />
          </ChartCard>
        )}
      </div>

      {summary.credits?.assigned === undefined ? null : (
        <Panel>
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <Th>Credits assigned</Th>
                <Th>Spent</Th>
                <Th>Left</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>{summary.credits.assigned}</Td>
                <Td>{summary.credits.spent ?? '—'}</Td>
                <Td>{summary.credits.remaining ?? '—'}</Td>
              </tr>
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

function Endpoints({ summary }: { summary: Summary }) {
  if (summary.services.length === 0) {
    return <p className="text-sm text-muted-foreground">This run recorded no service health.</p>;
  }
  return (
    <Panel>
      <table className="w-full text-sm">
        <thead className="border-b border-border">
          <tr>
            <Th>Service</Th>
            <Th>Version</Th>
            <Th>Status</Th>
            <Th>Note</Th>
          </tr>
        </thead>
        <tbody>
          {summary.services.map((service) => (
            <tr key={service.key} className="border-b border-border last:border-0">
              <Td className="font-medium">{service.label}</Td>
              <Td className="tabular-nums text-muted-foreground">{service.version ?? '—'}</Td>
              <Td>
                <AnimatedBadge status={SERVICE_STATUS[service.status]} size="sm">
                  {service.status}
                </AnimatedBadge>
              </Td>
              <Td className="text-muted-foreground">{service.problem ?? '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function Features({ summary }: { summary: Summary }) {
  return (
    <Panel>
      <table className="w-full text-sm">
        <thead className="border-b border-border">
          <tr>
            <Th>Section</Th>
            <Th>Feature</Th>
            <Th>Passed</Th>
            <Th>Failed</Th>
            <Th>Flaky</Th>
            <Th>Skipped</Th>
            <Th>Duration</Th>
          </tr>
        </thead>
        <tbody>
          {summary.features.map((feature) => (
            <tr
              key={`${feature.section}/${feature.name}`}
              className="border-b border-border last:border-0"
            >
              <Td className="text-muted-foreground">{feature.section}</Td>
              <Td className="font-medium">{feature.name}</Td>
              <Td className="tabular-nums">{feature.passed}</Td>
              <Td className={`tabular-nums ${feature.failed ? 'text-fail font-semibold' : ''}`}>
                {feature.failed}
              </Td>
              <Td className={`tabular-nums ${feature.flaky ? 'text-flake' : ''}`}>
                {feature.flaky}
              </Td>
              <Td className="tabular-nums">{feature.skipped}</Td>
              <Td className="tabular-nums text-muted-foreground">{duration(feature.durationMs)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function Failures({
  summary,
  scenarios,
  onOpenScenario,
}: {
  summary: Summary;
  scenarios: Record<string, string>;
  onOpenScenario: (scenarioPath: string) => void;
}) {
  if (summary.totalFailures === 0) {
    return <p className="text-sm text-muted-foreground">Nothing failed in this run.</p>;
  }
  const hidden = summary.totalFailures - summary.failures.length;
  return (
    <div className="space-y-3">
      {summary.failures.map((failure) => {
        const scenario = scenarios[failure.file];
        return (
          <Panel key={`${failure.file}:${failure.line}:${failure.title}`}>
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-2">
              <div className="min-w-0">
                <p className="font-medium">{failure.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {failure.file}:{failure.line} · {failure.project}
                </p>
              </div>
              {scenario ? (
                <button
                  type="button"
                  onClick={() => onOpenScenario(scenario)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-primary underline underline-offset-4 hover:bg-muted"
                >
                  Scenario
                </button>
              ) : null}
            </div>
            <pre className="overflow-x-auto px-4 py-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {failure.error}
            </pre>
          </Panel>
        );
      })}
      {hidden > 0 ? (
        <p className="text-sm text-muted-foreground">
          …and {hidden} more. The Playwright report has all of them.
        </p>
      ) : null}
    </div>
  );
}

function Report({ run, suite }: { run: string; suite: Suite }) {
  const href = `${reportPath(run, suite)}/index.html`;
  return (
    <div className="space-y-3">
      <a
        className="inline-block text-sm text-primary underline underline-offset-4"
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        Open the full report in a new tab
      </a>

      <iframe
        src={href}
        title="Playwright report"
        // oxlint-disable-next-line react/iframe-missing-sandbox -- see above
        sandbox="allow-scripts allow-same-origin"
        className="h-[80vh] w-full rounded-xl border border-border bg-card"
      />
    </div>
  );
}

/** A deployment nobody has taught the page about still gets a sensible glyph. */
const ENVIRONMENT_ICON: Record<string, LucideIcon> = {
  staging: FlaskConical,
  production: Rocket,
};

const EMPTY_SUMMARIES: Record<Suite, Summary | null> = { regular: null, slow: null };
const EMPTY_SCENARIOS: Record<Suite, Record<string, string>> = { regular: {}, slow: {} };

export function App() {
  const [runs, setRuns] = useState<string[]>([]);
  const [environment, setEnvironment] = useState<string>('staging');
  const [run, setRun] = useState<string>('');
  const [suite, setSuite] = useState<Suite>('regular');
  const [summaries, setSummaries] = useState<Record<Suite, Summary | null>>(EMPTY_SUMMARIES);
  const [scenarios, setScenarios] =
    useState<Record<Suite, Record<string, string>>>(EMPTY_SCENARIOS);
  const [openScenario, setOpenScenario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const loaded = await loadRuns();
      setRuns(loaded);
      // Staging by default, as asked. Nothing has published production yet, so
      // fall back to whatever is there rather than opening on an empty page.
      const startOn = loaded.find((value) => runEnvironment(value) === 'staging') ?? loaded[0];
      if (startOn) {
        setEnvironment(runEnvironment(startOn));
        setRun(startOn);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!run) return;
    let current = true;
    void (async () => {
      // Both suites at once. The slow half is missing for most runs, and its
      // absence is exactly what decides whether the suite switch is offered —
      // so it is read here rather than probed when the switch is clicked.
      const [regular, slow, regularScenarios, slowScenarios] = await Promise.all([
        loadSummary(run, 'regular'),
        loadSummary(run, 'slow'),
        loadScenarioIndex(run, 'regular'),
        loadScenarioIndex(run, 'slow'),
      ]);
      if (!current) return;
      setSummaries({ regular, slow });
      setScenarios({ regular: regularScenarios, slow: slowScenarios });
      // Dispatched on its own, the slow suite publishes a folder with no regular
      // half in it. Opening on Regular there shows "no summary" with the answer
      // sitting unclicked in the switch beside it.
      if (!regular && slow) setSuite('slow');
    })();
    return () => {
      current = false;
    };
  }, [run]);

  // Derived, not stored: an environment with nothing published must not show the
  // previous one's numbers while its own fetch never happens.
  const summary = run ? summaries[suite] : null;

  // runs.json is newest first, so all of these come out newest first too.
  // Both deployments are always offered, even before one has published
  // anything — production has not, and a picker with a single option in it is
  // not a picker. Anything else that turns up in a folder name joins them.
  const environments = useMemo(
    () => [...new Set(['production', 'staging', ...runs.map(runEnvironment)])].toSorted(),
    [runs]
  );
  const ofEnvironment = useMemo(
    () => runs.filter((value) => runEnvironment(value) === environment),
    [runs, environment]
  );
  const days = useMemo(() => [...new Set(ofEnvironment.map(runDay))], [ofEnvironment]);
  const versions = useMemo(
    () => ofEnvironment.filter((value) => runDay(value) === runDay(run)),
    [ofEnvironment, run]
  );

  // A drawer left open across a run change would show the wrong run's scenario.
  // Closing it belongs to the event that picked the run, not to an effect — so
  // both dropdowns go through here rather than one of them setting state raw.
  const pickRun = useCallback((next: string) => {
    setOpenScenario(null);
    // The next run may have no slow half, and a switch stuck on a suite that is
    // not there would show an empty page.
    setSuite('regular');
    setRun(next);
  }, []);

  // Same reasoning as pickRun: the open scenario belongs to the suite that was
  // showing when it was opened.
  const pickSuite = useCallback((next: string) => {
    setOpenScenario(null);
    setSuite(next === 'slow' ? 'slow' : 'regular');
  }, []);

  // A day is a prefix, not a run; land on its newest.
  const pickDay = useCallback(
    (next: string) => {
      const newest = ofEnvironment.find((value) => runDay(value) === next);
      if (newest) pickRun(newest);
    },
    [ofEnvironment, pickRun]
  );

  // Neither is an environment a run. Production may have nothing published at
  // all, and the empty state below says so rather than leaving the last
  // staging run on screen under a production label.
  const pickEnvironment = useCallback(
    (next: string) => {
      setEnvironment(next);
      const newest = runs.find((value) => runEnvironment(value) === next);
      pickRun(newest ?? '');
    },
    [runs, pickRun]
  );

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  }

  if (runs.length === 0) {
    return <p className="p-8 text-sm text-muted-foreground">No runs published yet.</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">Open Brain Institute e2e test summary</h1>
          {summary ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {summary.noResults ? (
                <AnimatedBadge status="warning" size="sm">
                  No results
                </AnimatedBadge>
              ) : (
                <AnimatedBadge status={summary.failed > 0 ? 'danger' : 'success'} size="sm">
                  {summary.failed > 0 ? `${summary.failed} failing` : 'All green'}
                </AnimatedBadge>
              )}
              <AnimatedBadge status="info" size="sm">
                {summary.trigger}
              </AnimatedBadge>
              <AnimatedBadge status="neutral" size="sm">
                {summary.browser}
              </AnimatedBadge>
              <AnimatedBadge status="neutral" size="sm">
                {duration(summary.durationMs)}
              </AnimatedBadge>
              {summary.runUrl ? (
                <a
                  className="ml-1 text-xs text-muted-foreground underline underline-offset-4"
                  href={summary.runUrl}
                >
                  Actions run
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* One row, narrowing left to right: the deployment picks the runs, the
            day picks among those, the time picks among that day's, and the suite
            picks which half of the run. The last two hide when there is nothing
            to choose. */}
        <div className="flex flex-wrap items-center gap-2">
          <Combobox value={environment} onValueChange={pickEnvironment} className="w-52 shrink-0">
            <ComboboxTrigger>
              <ComboboxInput aria-label="Search deployments" placeholder="Deployment…" />
            </ComboboxTrigger>
            <ComboboxContent>
              <ComboboxList ariaLabel="Deployments">
                <ComboboxEmpty>No deployment by that name.</ComboboxEmpty>
                {environments.map((value) => {
                  const Icon = ENVIRONMENT_ICON[value] ?? Globe;
                  return (
                    <ComboboxItem key={value} value={value} textValue={value}>
                      <Icon aria-hidden className="size-4 shrink-0" />
                      <span className="truncate capitalize">{value}</span>
                    </ComboboxItem>
                  );
                })}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {/* A deployment with nothing published has no days to offer. */}
          {days.length > 0 ? (
            <Select value={runDay(run)} onValueChange={pickDay}>
              <SelectTrigger className="min-w-32">
                <SelectValue placeholder="Pick a day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((value) => (
                  <SelectItem key={value} value={value}>
                    {shortDate(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {/* One run is the usual case; a dropdown of one option is just noise. */}
          {run && versions.length > 1 ? (
            <Select value={run} onValueChange={pickRun}>
              <SelectTrigger className="min-w-24">
                <SelectValue placeholder="Pick a run" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {runTime(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {/* Only runs whose slow suite has published get the switch. `run` is in
              here because the summaries are the last run's until the next one
              loads, and a deployment with none never loads one. */}
          {run && summaries.slow ? (
            <Select value={suite} onValueChange={pickSuite}>
              <SelectTrigger className="min-w-24">
                <SelectValue placeholder="Suite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="slow">Slow</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </header>

      {!run ? (
        <p className="text-sm text-muted-foreground">
          Nothing has been published for {environment} yet.
        </p>
      ) : summary === null ? (
        <p className="text-sm text-muted-foreground">This run has no summary.</p>
      ) : summary.noResults ? (
        <p className="text-sm text-muted-foreground">
          This run wrote no report at all, so its counts are unknown rather than zero.
        </p>
      ) : (
        <Tabs defaultValue="overview" variant="segment">
          {/* Five tabs do not fit a phone; let the strip scroll rather than clip. */}
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="failures">Failures</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="overview">
              <Overview summary={summary} />
            </TabsContent>
            <TabsContent value="endpoints">
              <Endpoints summary={summary} />
            </TabsContent>
            <TabsContent value="features">
              <Features summary={summary} />
            </TabsContent>
            <TabsContent value="failures">
              <Failures
                summary={summary}
                scenarios={run ? scenarios[suite] : {}}
                onOpenScenario={setOpenScenario}
              />
            </TabsContent>
            <TabsContent value="report">
              <Report run={run} suite={suite} />
            </TabsContent>
          </div>
        </Tabs>
      )}

      <ScenarioDrawer
        run={run}
        suite={suite}
        scenarioPath={openScenario}
        onClose={() => setOpenScenario(null)}
      />
    </div>
  );
}
