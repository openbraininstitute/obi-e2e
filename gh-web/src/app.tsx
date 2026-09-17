import { useEffect, useMemo, useState } from 'react';

import {
  ChartCard,
  DurationChart,
  FeatureChart,
  Legend,
  OutcomeChart,
  PassRateChart,
} from '@/charts';
import { AnimatedBadge, type AnimatedBadgeStatus } from '@/components/motion/animated-badge';
import { AnimatedNumber } from '@/components/motion/animated-number';
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
  type HistoryEntry,
  isReal,
  loadDays,
  loadHistory,
  loadSummary,
  passRate,
  percent,
  type ServiceStatus,
  shortDate,
  type Summary,
} from '@/data';

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

function Overview({ summary, history }: { summary: Summary; history: HistoryEntry[] }) {
  const rate = passRate(summary);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="Pass rate" value={rate} format={(n) => percent.format(n)} />
        <Tile label="Passed" value={summary.passed} tone="var(--pass)" />
        <Tile label="Failed" value={summary.failed} tone={summary.failed ? 'var(--fail)' : ''} />
        <Tile label="Flaky" value={summary.flaky} tone={summary.flaky ? 'var(--flake)' : ''} />
        <Tile label="Skipped" value={summary.skipped} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pass rate" hint="Every run the branch still remembers.">
          <PassRateChart history={history} />
        </ChartCard>
        <ChartCard title="Duration" hint="Wall clock for the whole suite.">
          <DurationChart history={history} />
        </ChartCard>
        <ChartCard title="Failures and flakes" hint="Per run. Passes are the tile above.">
          <OutcomeChart history={history} />
          <Legend items={['flaky', 'failed']} />
        </ChartCard>
        <ChartCard title="This run by feature" hint="The twelve busiest features.">
          <FeatureChart features={summary.features} />
          <Legend items={['passed', 'skipped', 'flaky', 'failed']} />
        </ChartCard>
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

function Failures({ summary }: { summary: Summary }) {
  if (summary.totalFailures === 0) {
    return <p className="text-sm text-muted-foreground">Nothing failed in this run.</p>;
  }
  const hidden = summary.totalFailures - summary.failures.length;
  return (
    <div className="space-y-3">
      {summary.failures.map((failure) => (
        <Panel key={`${failure.file}:${failure.line}:${failure.title}`}>
          <div className="border-b border-border px-4 py-2">
            <p className="font-medium">{failure.title}</p>
            <p className="text-xs text-muted-foreground">
              {failure.file}:{failure.line} · {failure.project}
            </p>
          </div>
          <pre className="overflow-x-auto px-4 py-3 text-xs whitespace-pre-wrap text-muted-foreground">
            {failure.error}
          </pre>
        </Panel>
      ))}
      {hidden > 0 ? (
        <p className="text-sm text-muted-foreground">
          …and {hidden} more. The Playwright report has all of them.
        </p>
      ) : null}
    </div>
  );
}

function Report({ day }: { day: string }) {
  const href = `runs/${day}/report/index.html`;
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

export function App() {
  const [days, setDays] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [day, setDay] = useState<string>('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [loadedDays, loadedHistory] = await Promise.all([loadDays(), loadHistory()]);
      setDays(loadedDays);
      setHistory(loadedHistory.filter(isReal));
      setDay(loadedDays[0] ?? '');
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!day) return;
    let current = true;
    void (async () => {
      const loaded = await loadSummary(day);
      if (current) setSummary(loaded);
    })();
    return () => {
      current = false;
    };
  }, [day]);

  const trend = useMemo(() => history.toSorted((a, b) => a.date.localeCompare(b.date)), [history]);

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  }

  if (days.length === 0) {
    return <p className="p-8 text-sm text-muted-foreground">No runs published yet.</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">OBI end-to-end</h1>
          {summary ? (
            <p className="text-xs text-muted-foreground">
              {summary.environment} · {summary.browser} · {summary.trigger} ·{' '}
              {duration(summary.durationMs)}
              {summary.runUrl ? (
                <>
                  {' · '}
                  <a className="underline underline-offset-4" href={summary.runUrl}>
                    Actions run
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {summary && !summary.noResults ? (
            <AnimatedBadge status={summary.failed > 0 ? 'danger' : 'success'} size="sm">
              {summary.failed > 0 ? `${summary.failed} failing` : 'All green'}
            </AnimatedBadge>
          ) : null}
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger className="min-w-44">
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
        </div>
      </header>

      {summary === null ? (
        <p className="text-sm text-muted-foreground">This day has no summary.</p>
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
              <Overview summary={summary} history={trend} />
            </TabsContent>
            <TabsContent value="endpoints">
              <Endpoints summary={summary} />
            </TabsContent>
            <TabsContent value="features">
              <Features summary={summary} />
            </TabsContent>
            <TabsContent value="failures">
              <Failures summary={summary} />
            </TabsContent>
            <TabsContent value="report">
              <Report day={day} />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
