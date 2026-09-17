/**
 * Two charts, both about the run being looked at.
 *
 * Colours are the CSS variables the rest of the page uses, passed straight
 * through to SVG `fill`, so a theme change reaches the charts without a rebuild.
 */

import { barX } from '@tanstack/charts/bar';
import { pie, polar, radialArc } from '@tanstack/charts/polar';
import { Chart } from '@tanstack/charts/react';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { defineChart } from '@tanstack/charts/scene';
import { stack } from '@tanstack/charts/stack';
import { tooltip } from '@tanstack/charts/tooltip';
import { useMemo } from 'react';

import type { CreditReport, Summary } from '@/data';

const OUTCOME_FILL: Record<string, string> = {
  passed: 'var(--pass)',
  failed: 'var(--fail)',
  flaky: 'var(--flake)',
  skipped: 'var(--skip)',
};

const CREDIT_FILL: Record<string, string> = {
  spent: 'var(--primary)',
  left: 'var(--skip)',
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

function Empty({ children, height }: { children: React.ReactNode; height: number }) {
  return (
    <p
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      {children}
    </p>
  );
}

const percent = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
});

/** What `pie` adds to each slice. The polar wrapper erases the datum type. */
type Slice = { outcome: string; count: number; fraction: number };

/** The run's four verdicts, as one rounded donut. */
export function ResultsDonut({ summary }: { summary: Summary }) {
  const slices = useMemo(
    () =>
      (['passed', 'failed', 'flaky', 'skipped'] as const)
        .map((outcome) => ({ outcome, count: summary[outcome] }))
        .filter((slice) => slice.count > 0),
    [summary]
  );

  const definition = useMemo(
    () =>
      defineChart(
        {
          marks: [
            polar({
              radiusRatio: 0.8,
              marks: [
                // `pie` materialises the gap into each slice's own interval, so
                // the arc must not pad again on top of it.
                radialArc(pie(slices, { value: 'count', gapAngle: (Math.PI / 180) * 3 }), {
                  key: 'outcome',
                  innerRadius: ({ radius }) => radius * 0.58,
                  cornerRadius: 8,
                  fill: (slice) => OUTCOME_FILL[slice.outcome] ?? OUTCOME_FILL.skipped!,
                }),
              ],
              scales: { angle: null, radius: null },
            }),
          ],
          /*
           * Not optional, however much a donut has no use for them: the types
           * accept `scales: {}` and the runtime then throws "Chart scales must
           * define reserved `x` and `y` entries". `null` is how the library is
           * told this chart has no cartesian scale, and nothing is drawn for it.
           */
          scales: { x: null, y: null },
          margin: 0,
        },
        {
          tooltip: {
            use: tooltip,
            // `polar` erases the datum type on the way out, so the shape `pie`
            // put in has to be named again here.
            format: (point) => {
              const slice = point.datum as Slice;
              return `${slice.outcome}: ${slice.count} (${percent.format(slice.fraction)})`;
            },
          },
        }
      ),
    [slices]
  );

  if (slices.length === 0) return <Empty height={260}>This run recorded no tests.</Empty>;
  return <Chart definition={definition} height={260} ariaLabel="Results for this run" />;
}

/**
 * The project's credits as one line cut into segments.
 *
 * Assigned is the whole line, split where the run stopped spending. Two numbers
 * on one axis is the thing a tile cannot show and a second tile makes you
 * subtract for.
 */
export function CreditsBar({ credits }: { credits: CreditReport }) {
  const segments = useMemo(() => {
    const assigned = credits.assigned ?? credits.required;
    const spent = Math.max(0, credits.spent ?? 0);
    // Prefer what the service reported over the subtraction, and never let the
    // two disagreeing push a segment below zero.
    const left = Math.max(0, credits.remaining ?? assigned - spent);
    return [
      { label: 'Credits', segment: 'spent', value: spent },
      { label: 'Credits', segment: 'left', value: left },
    ].filter((row) => row.value > 0);
  }, [credits]);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barX(segments, {
            x: 'value',
            y: 'label',
            z: 'segment',
            layout: stack({ order: ['spent', 'left'] }),
            fill: (row: (typeof segments)[number]) => CREDIT_FILL[row.segment] ?? 'var(--skip)',
            radius: { end: 4 },
            maxThickness: 28,
          }),
        ],
        scales: {
          x: { scale: scaleLinear, nice: true, grid: true },
          // The single row needs no label: the card title already says Credits.
          y: { scale: () => scaleBand().padding(0.6), axis: false },
        },
        tooltip,
      }),
    [segments]
  );

  if (segments.length === 0) return <Empty height={120}>This run was given no credits.</Empty>;
  return <Chart definition={definition} height={120} ariaLabel="Credits spent and left" />;
}

/** The colours, spelled out under the chart that uses them. */
export function Legend({ items }: { items: readonly { key: string; label: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-[3px]"
            style={{ background: OUTCOME_FILL[item.key] ?? CREDIT_FILL[item.key] ?? 'var(--skip)' }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
