/** Toggles the column chooser shows: one per column, plus "Select all". */
export function toggleCount(shown: string[], hidden: string[]): number {
  return shown.length + hidden.length + 1;
}
