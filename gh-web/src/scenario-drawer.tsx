import { Markdown } from '@tanstack/markdown/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Drawer } from '@/components/motion/drawer';
import { loadScenario, type Suite } from '@/data';

/** What came back, and for which run and path, so "still loading" is derived. */
type Loaded = { run: string; suite: Suite; path: string; markdown: string | null };

/**
 * The scenario behind a failing test, in a drawer beside it.
 *
 * Deliberately not modal: it takes half the page, and the point is to read the
 * scenario while the failures stay readable and clickable next to it. Escape
 * closes it, as does the button.
 */
export function ScenarioDrawer({
  run,
  suite,
  scenarioPath,
  onClose,
}: {
  run: string;
  suite: Suite;
  scenarioPath: string | null;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!scenarioPath) return;
    let current = true;
    void (async () => {
      const markdown = await loadScenario(run, scenarioPath, suite);
      if (current) setLoaded({ run, suite, path: scenarioPath, markdown });
    })();
    return () => {
      current = false;
    };
  }, [run, suite, scenarioPath]);

  const ready =
    loaded?.path === scenarioPath && loaded.run === run && loaded.suite === suite ? loaded : null;

  return (
    <Drawer
      open={scenarioPath !== null}
      onOpenChange={(open) => !open && onClose()}
      side="right"
      // No backdrop and no scroll lock: the failures list beside it stays
      // readable, scrollable and clickable while a scenario is open.
      modal={false}
      ariaLabel="Scenario"
      className="w-1/2 max-w-none"
    >
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Scenario</h2>
          <p className="truncate text-xs text-muted-foreground">{scenarioPath}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the scenario"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {ready === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : ready.markdown === null ? (
          <p className="text-sm text-muted-foreground">
            This run published no scenario for that spec.
          </p>
        ) : (
          <article className="scenario">
            <Markdown>{ready.markdown}</Markdown>
          </article>
        )}
      </div>
    </Drawer>
  );
}
