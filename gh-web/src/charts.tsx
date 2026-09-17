import { areaY } from '@tanstack/charts/area';
import { barX, barY } from '@tanstack/charts/bar';
import { dot } from '@tanstack/charts/dot';
import { lineY } from '@tanstack/charts/line';
import { Chart } from '@tanstack/charts/react';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { defineChart } from '@tanstack/charts/scene';
import { stack } from '@tanstack/charts/stack';
import { tooltip } from '@tanstack/charts/tooltip';
import { useMemo } from 'react';

import { duration, type Feature, type HistoryEntry, passRate, percent, shortDate } from '@/data';

const PASS = 'var(--pass)';
const FAIL = 'var(--fail)';
const FLAKE = 'var(--flake)';
const SKIP = 'var(--skip)';

const OUTCOME_FILL: Record<string, string> = {
  passed: PASS,
  failed: FAIL,
  flaky: FLAKE,
  skipped: SKIP,
};

/** Every chart sits in the same framed box, so a row of them lines up. */
export function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <header className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/** Pass rate across every run the history holds. */
export function PassRateChart({ history }: { history: HistoryEntry[] }) {
  const data = useMemo(
    () =>
      history.map((run) => ({
        ...run,
        rate: passRate(run),
        label: shortDate(run.date),
      })),
    [history]
  );

  const floor = useMemo(() => {
    const worst = Math.min(...data.map((run) => run.rate), 1);
    return Math.min(0.9, Math.max(0, Math.floor(worst * 20 - 1) / 20));
  }, [data]);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          // Without an explicit baseline the area anchors at zero and drags the
          // whole domain back down to it, undoing the floor below.
          areaY(data, {
            x: 'label',
            y: 'rate',
            y1: floor,
            fill: PASS,
            fillOpacity: 0.14,
          }),
          lineY(data, { x: 'label', y: 'rate', stroke: PASS, strokeWidth: 2 }),
          dot(data, { x: 'label', y: 'rate', fill: PASS, r: 3 }),
        ],
        scales: {
          x: { scale: () => scaleBand().padding(0.1) },
          y: {
            scale: scaleLinear,
            domain: [floor, 1],
            includeZero: false,
            grid: true,
            axis: {
              ticks: { format: (value: number) => percent.format(value) },
            },
          },
        },
        tooltip,
      }),
    [data, floor]
  );

  if (data.length < 2) return <Empty>Two runs are needed before a trend means anything.</Empty>;
  return <Chart definition={definition} height={220} ariaLabel="Pass rate over time" />;
}

export function DurationChart({ history }: { history: HistoryEntry[] }) {
  const data = useMemo(
    () =>
      history.map((run) => ({
        ...run,
        minutes: run.durationMs / 60_000,
        label: shortDate(run.date),
      })),
    [history]
  );

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          lineY(data, {
            x: 'label',
            y: 'minutes',
            stroke: 'var(--primary)',
            strokeWidth: 2,
          }),
          dot(data, { x: 'label', y: 'minutes', fill: 'var(--primary)', r: 3 }),
        ],
        scales: {
          x: { scale: () => scaleBand().padding(0.1) },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
            axis: { label: 'Minutes' },
          },
        },
        tooltip,
      }),
    [data]
  );

  if (data.length < 2) return <Empty>Two runs are needed before a trend means anything.</Empty>;
  return <Chart definition={definition} height={220} ariaLabel="Suite duration over time" />;
}

export function OutcomeChart({ history }: { history: HistoryEntry[] }) {
  const data = useMemo(
    () =>
      history.flatMap((run) =>
        (['failed', 'flaky'] as const)
          .map((outcome) => ({
            label: shortDate(run.date),
            outcome,
            count: run[outcome],
          }))
          .filter((row) => row.count > 0)
      ),
    [history]
  );

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(data, {
            x: 'label',
            y: 'count',
            z: 'outcome',
            layout: stack({ order: ['flaky', 'failed'] }),
            fill: (row: (typeof data)[number]) => OUTCOME_FILL[row.outcome] ?? SKIP,
            radius: { end: 3 },
          }),
        ],
        scales: {
          x: { scale: () => scaleBand().padding(0.22) },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
            axis: { label: 'Tests' },
          },
        },
        tooltip,
      }),
    [data]
  );

  if (data.length === 0) {
    return <Empty>Nothing has failed or flaked in the runs on record.</Empty>;
  }
  return <Chart definition={definition} height={220} ariaLabel="Failures and flakes per run" />;
}

export function FeatureChart({ features }: { features: Feature[] }) {
  const data = useMemo(
    () =>
      features
        // A feature that only failed matters more than one that only skipped.
        .toSorted((a, b) => b.failed + b.flaky - (a.failed + a.flaky) || b.passed - a.passed)
        .slice(0, 12)
        .flatMap((feature) =>
          (['passed', 'flaky', 'failed', 'skipped'] as const)
            .map((outcome) => ({
              name: feature.name,
              outcome,
              count: feature[outcome],
            }))
            .filter((row) => row.count > 0)
        ),
    [features]
  );

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barX(data, {
            x: 'count',
            y: 'name',
            z: 'outcome',
            layout: stack({ order: ['passed', 'skipped', 'flaky', 'failed'] }),
            fill: (row: (typeof data)[number]) => OUTCOME_FILL[row.outcome] ?? SKIP,
            radius: { end: 3 },
          }),
        ],
        scales: {
          x: {
            scale: scaleLinear,
            nice: true,
            grid: true,
            axis: { label: 'Tests' },
          },
          y: { scale: () => scaleBand().padding(0.25) },
        },
        tooltip,
      }),
    [data]
  );

  if (data.length === 0) return <Empty>This run recorded no features.</Empty>;
  return (
    <Chart
      definition={definition}
      height={Math.max(220, features.length * 28)}
      ariaLabel="Outcomes by feature"
    />
  );
}

export function Legend({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-[3px]"
            style={{ background: OUTCOME_FILL[item] ?? SKIP }}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

export { duration };
