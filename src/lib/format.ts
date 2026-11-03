const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('en-US');

/** `"2026-03-14T10:00:00Z"` → `"Mar 14, 2026"`. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** `0.124` → `"+12.4%"`, with an explicit sign for trends. */
export function formatPercentChange(ratio: number): string {
  const percent = (ratio * 100).toFixed(1);
  return ratio > 0 ? `+${percent}%` : `${percent}%`;
}

/** `"admin"` → `"Admin"`. */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** `"Jane Doe"` → `"JD"`. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}
