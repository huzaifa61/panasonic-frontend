// Categorical palette from the dataviz reference (validated: adjacent + all-pairs
// checks pass for the slot counts used in this app). Keep in sync with the
// --series-N custom properties in styles.scss.
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'];

export const CHART_CHROME = {
  surface: '#fcfcfb',
  textPrimary: '#0b0b0b',
  textSecondary: '#52514e',
  muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7'
};

// Fixed category -> color assignment so identity never depends on filtering
// or sort order (color follows the entity, never its rank).
const CATEGORY_COLOR_MAP: Record<string, string> = {
  Television: SERIES_COLORS[0],
  'Air Conditioner': SERIES_COLORS[1],
  Refrigerator: SERIES_COLORS[2],
  'Washing Machine': SERIES_COLORS[3],
  'Microwave Oven': SERIES_COLORS[4],
  'Operations Cost': SERIES_COLORS[5]
};

export function categoryColor(name: string): string {
  return CATEGORY_COLOR_MAP[name] ?? CHART_CHROME.muted;
}
