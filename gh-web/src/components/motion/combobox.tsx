'use client';

/**
 * A searchable single-select, from beui.dev/components/motion/combobox.
 *
 * Vendored rather than installed, like every other component in this folder.
 * The upstream piece ships groups, labels and separators too; none of them are
 * used here, so none of them were copied — dead components rot quietly.
 *
 * The panel is portalled to the body and measured against the trigger, because
 * the header it sits in is a flex row that would otherwise clip it.
 */

import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { motion, type Transition, useReducedMotion } from 'motion/react';
import {
  createContext,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { EASE_OUT, SPRING_LAYOUT } from '@/lib/ease';
import { cn } from '@/lib/utils';

const MORPH: Transition = { type: 'spring', duration: 0.5, bounce: 0.22 };
const VIEWPORT_PADDING = 8;

type RegisteredItem = {
  value: string;
  label: string;
  disabled: boolean;
  id: string;
  ref: RefObject<HTMLButtonElement | null>;
};

/** Subsequence match, so "prd" still finds "production". */
const defaultFilter = (value: string, query: string, labels: string[]) => {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;

  const haystack = [value, ...labels].join(' ').toLocaleLowerCase();
  let index = 0;
  for (const character of haystack) {
    if (character === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
};

type ComboboxContextValue = {
  open: boolean;
  setOpen: (open: boolean, restoreFocus?: boolean) => void;
  value: string | undefined;
  select: (value: string) => void;
  query: string;
  setQuery: (query: string) => void;
  activeValue: string | null;
  setActiveValue: (value: string | null) => void;
  moveActive: (direction: 1 | -1) => void;
  selectActive: () => void;
  registerItem: (item: RegisteredItem) => void;
  unregisterItem: (value: string) => void;
  labelFor: (value: string | undefined) => string | undefined;
  isVisible: (value: string) => boolean;
  visibleCount: number;
  activeItemId: string | undefined;
  listId: string;
  inputId: string;
  reduce: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  activeLayoutId: string;
};

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useComboboxContext(component: string) {
  const context = useContext(ComboboxContext);
  if (!context) throw new Error(`${component} must be used within <Combobox>`);
  return context;
}

export function Combobox({
  children,
  value,
  onValueChange,
  className,
}: {
  children: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeValue, setActive] = useState<string | null>(null);
  const [items, setItems] = useState<Map<string, RegisteredItem>>(new Map());

  const updateOpen = useCallback((next: boolean, restoreFocus = false) => {
    setOpen(next);
    if (!next) setQuery('');
    if (restoreFocus) {
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    }
  }, []);

  const registerItem = useCallback((item: RegisteredItem) => {
    setItems((current) => {
      const existing = current.get(item.value);
      if (existing?.label === item.label && existing.disabled === item.disabled) return current;
      return new Map(current).set(item.value, item);
    });
  }, []);

  const unregisterItem = useCallback((itemValue: string) => {
    setItems((current) => {
      if (!current.has(itemValue)) return current;
      const next = new Map(current);
      next.delete(itemValue);
      return next;
    });
  }, []);

  const visible = useMemo(
    () => [...items.values()].filter((item) => defaultFilter(item.value, query, [item.label])),
    [items, query]
  );
  const selectable = useMemo(() => visible.filter((item) => !item.disabled), [visible]);

  // The highlight follows the selection until the query moves it, and never
  // points at a row the filter has taken away.
  const active = selectable.some((item) => item.value === activeValue)
    ? activeValue
    : (selectable.find((item) => item.value === value)?.value ?? selectable[0]?.value ?? null);

  const select = useCallback(
    (next: string) => {
      if (items.get(next)?.disabled) return;
      onValueChange(next);
      updateOpen(false, true);
    },
    [items, onValueChange, updateOpen]
  );

  const moveActive = useCallback(
    (direction: 1 | -1) => {
      if (selectable.length === 0) return;
      const at = selectable.findIndex((item) => item.value === active);
      const next = (at + direction + selectable.length) % selectable.length;
      setActive(selectable[next]?.value ?? null);
    },
    [active, selectable]
  );

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const inside = (target: Node) =>
      rootRef.current?.contains(target) || contentRef.current?.contains(target);
    const onPointerDown = (event: PointerEvent) => {
      if (!inside(event.target as Node)) updateOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      updateOpen(false, true);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, updateOpen]);

  const context = useMemo<ComboboxContextValue>(
    () => ({
      open,
      setOpen: updateOpen,
      value,
      select,
      query,
      setQuery,
      activeValue: active,
      setActiveValue: setActive,
      moveActive,
      selectActive: () => active && select(active),
      registerItem,
      unregisterItem,
      labelFor: (itemValue) => (itemValue === undefined ? undefined : items.get(itemValue)?.label),
      isVisible: (itemValue) => visible.some((item) => item.value === itemValue),
      visibleCount: visible.length,
      activeItemId: active ? items.get(active)?.id : undefined,
      listId: `${baseId}-list`,
      inputId: `${baseId}-input`,
      reduce,
      triggerRef,
      contentRef,
      inputRef,
      activeLayoutId: `${baseId}-active`,
    }),
    [
      active,
      baseId,
      items,
      moveActive,
      open,
      query,
      reduce,
      registerItem,
      select,
      unregisterItem,
      updateOpen,
      value,
      visible,
    ]
  );

  return (
    <ComboboxContext.Provider value={context}>
      <div ref={rootRef} className={cn('relative', className)}>
        {children}
      </div>
    </ComboboxContext.Provider>
  );
}

export function ComboboxTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const context = useComboboxContext('ComboboxTrigger');
  return (
    <div
      ref={context.triggerRef}
      data-state={context.open ? 'open' : 'closed'}
      onPointerDown={(event) => {
        if (event.target === context.inputRef.current) return;
        event.preventDefault();
        context.inputRef.current?.focus({ preventScroll: true });
        context.setOpen(true);
      }}
      className={cn(
        'relative z-20 flex h-9 w-full cursor-text items-center justify-between gap-2 rounded-xl border border-border bg-transparent px-3 text-sm text-foreground',
        'focus-within:ring-2 focus-within:ring-foreground/20',
        className
      )}
    >
      <span className="min-w-0 flex-1 text-left">{children}</span>
      <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

export function ComboboxInput({
  className,
  'aria-label': ariaLabel = 'Search options',
  onKeyDown,
  placeholder = 'Search…',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'defaultValue' | 'value'>) {
  const context = useComboboxContext('ComboboxInput');
  const selectedLabel = context.labelFor(context.value);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!context.open) context.setOpen(true);
      else context.moveActive(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (context.open) context.selectActive();
      else context.setOpen(true);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <input
        {...props}
        ref={context.inputRef}
        id={context.inputId}
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={context.open}
        aria-controls={context.listId}
        aria-activedescendant={context.open ? context.activeItemId : undefined}
        autoComplete="off"
        // Closed, it reads as the current selection; open, as what you typed.
        value={context.open ? context.query : (selectedLabel ?? '')}
        placeholder={placeholder}
        onFocus={() => context.setOpen(true)}
        onChange={(event) => {
          context.setOpen(true);
          context.setQuery(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-9 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground',
          className
        )}
      />
    </div>
  );
}

export function ComboboxContent({
  children,
  sideOffset = 6,
  className,
}: {
  children: ReactNode;
  sideOffset?: number;
  className?: string;
}) {
  const context = useComboboxContext('ComboboxContent');
  const measureRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [layout, setLayout] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    panel: { width: number; height: number };
  } | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const measure = () => {
      const trigger = context.triggerRef.current;
      const panel = measureRef.current;
      if (!trigger || !panel) return;
      const rect = trigger.getBoundingClientRect();
      setLayout({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        panel: { width: panel.offsetWidth, height: panel.offsetHeight },
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (context.triggerRef.current) observer.observe(context.triggerRef.current);
    if (measureRef.current) observer.observe(measureRef.current);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [context.triggerRef, mounted]);

  if (!mounted) return null;

  // Right-aligned under the trigger, then pulled back inside the viewport.
  const panelWidth = layout?.panel.width ?? layout?.width ?? 0;
  const desired = (layout?.left ?? 0) + (layout?.width ?? 0) - panelWidth;
  const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - panelWidth - VIEWPORT_PADDING);
  const left = Math.min(Math.max(desired, VIEWPORT_PADDING), maxLeft);

  return createPortal(
    <motion.div
      ref={context.contentRef}
      aria-hidden={!context.open}
      initial={false}
      animate={{
        height: context.open ? (layout?.panel.height ?? 0) : 0,
        opacity: context.open ? 1 : 0,
        y: context.open ? sideOffset : 0,
      }}
      transition={context.reduce ? { duration: 0 } : MORPH}
      style={
        {
          left,
          top: layout ? layout.top + layout.height : undefined,
          minWidth: layout?.width,
          pointerEvents: context.open ? 'auto' : 'none',
          visibility: layout ? 'visible' : 'hidden',
        } as CSSProperties
      }
      className={cn(
        'fixed z-50 overflow-hidden rounded-xl border border-border bg-background outline-none',
        className
      )}
    >
      <div ref={measureRef}>{children}</div>
    </motion.div>,
    document.body
  );
}

export function ComboboxList({
  children,
  ariaLabel = 'Options',
  className,
}: {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  const context = useComboboxContext('ComboboxList');
  return (
    <div
      id={context.listId}
      role="listbox"
      aria-label={ariaLabel}
      className={cn(
        'relative isolate max-h-64 overflow-y-auto overscroll-contain p-1.5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ComboboxItem({
  value,
  children,
  textValue,
  disabled = false,
  className,
}: {
  value: string;
  children: ReactNode;
  textValue?: string;
  disabled?: boolean;
  className?: string;
}) {
  const context = useComboboxContext('ComboboxItem');
  const id = useId();
  const itemRef = useRef<HTMLButtonElement>(null);
  const label = textValue ?? (typeof children === 'string' ? children : value);
  const active = context.activeValue === value;
  const selected = context.value === value;
  const { registerItem, unregisterItem } = context;

  useLayoutEffect(() => {
    registerItem({ value, label, disabled, id, ref: itemRef });
    return () => unregisterItem(value);
  }, [disabled, id, label, registerItem, unregisterItem, value]);

  if (!context.isVisible(value)) return null;

  return (
    <button
      ref={itemRef}
      id={id}
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      tabIndex={-1}
      onPointerMove={() => !disabled && context.setActiveValue(value)}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => !disabled && context.select(value)}
      className={cn(
        'relative flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm outline-none transition-colors duration-150',
        active ? 'text-foreground' : 'text-muted-foreground',
        'disabled:pointer-events-none disabled:opacity-45',
        className
      )}
    >
      {active ? (
        <motion.span
          aria-hidden
          layoutId={context.activeLayoutId}
          className="absolute inset-0 -z-10 rounded-lg bg-muted"
          transition={context.reduce ? { duration: 0 } : SPRING_LAYOUT}
        />
      ) : null}
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      <motion.span
        aria-hidden
        initial={false}
        animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 0.82 }}
        transition={context.reduce ? { duration: 0 } : { duration: 0.14, ease: EASE_OUT }}
        className="grid size-5 shrink-0 place-items-center text-foreground"
      >
        <Check className="size-4" />
      </motion.span>
    </button>
  );
}

export function ComboboxEmpty({ children = 'Nothing matches.' }: { children?: ReactNode }) {
  const context = useComboboxContext('ComboboxEmpty');
  if (context.visibleCount > 0) return null;
  return (
    <div role="status" className="px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
