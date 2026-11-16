// The visual harness's rules, kept apart from the browser so they can
// be tested without one. See docs/visual-harness.md.

export const VISUAL_WIDTHS = [320, 390, 430, 768, 1024, 1280, 1366, 1440];
export const VISUAL_THEMES = ["light", "dark"] as const;

// The smallest a control may be on a touch screen.
export const MIN_TAP_PX = 44;
// The least two page blocks may stand apart.
export const MIN_GAP_PX = 12;
// A rounded border a fraction over its parent is not a defect.
export const SLACK_PX = 2;
// Widths at or under this are driven as touch screens.
export const TOUCH_MAX_WIDTH = 1024;

export type Fault = {
  scenario: string;
  kind: string;
  what: string;
  detail: string;
  width: number;
  theme: string;
};

// The same fault at eight widths is one thing to fix, so it is one line
// with the widths and themes it happens at.
export function summariseFaults(faults: Fault[]): string[] {
  const groups = new Map<string, { fault: Fault; widths: Set<number>; themes: Set<string> }>();
  for (const fault of faults) {
    const key = `${fault.scenario}|${fault.kind}|${fault.what}`;
    const group = groups.get(key) ?? { fault, widths: new Set<number>(), themes: new Set<string>() };
    group.widths.add(fault.width);
    group.themes.add(fault.theme);
    groups.set(key, group);
  }
  return [...groups.values()].map(({ fault, widths, themes }) => {
    const at = [...widths].sort((a, b) => a - b).join(", ");
    const where = themes.size === VISUAL_THEMES.length ? "both themes" : [...themes].join(", ");
    return `${fault.scenario}: ${fault.kind}: ${fault.what} (${fault.detail}) at ${at}; ${where}`;
  });
}
