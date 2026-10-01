// Small helpers for showing money and dates the way the design does.

function group(n: number): string {
  return Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 1204000 -> "₦1,204,000" */
export function naira(n: number): string {
  return `${n < 0 ? '−' : ''}₦${group(n)}`;
}

/** "2026-09-30" -> "30/09/2026" */
export function dayLabel(day: string): string {
  const [y, m, d] = day.split('-');
  return `${d}/${m}/${y}`;
}

/** "2026-09-30" -> "Wed, 30 Sep 2026" */
export function longDay(day: string): string {
  const date = new Date(`${day}T12:00:00`);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  return `${wd}, ${date.getDate()} ${mo} ${date.getFullYear()}`;
}

/** ISO time -> "10:52" */
export function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Today's date on this phone as "YYYY-MM-DD". */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  // Short ("Morning, Kasim") so longer names still fit at the top of the screen.
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

/** (3, "box") -> "3 boxes", (2, "delivery") -> "2 deliveries", (1, "bottle") -> "1 bottle" */
export function count(n: number, unit: string): string {
  if (n === 1) return `${n} ${unit}`;
  if (/[^aeiou]y$/.test(unit)) return `${n} ${unit.slice(0, -1)}ies`;
  return `${n} ${/(x|s|ch|sh)$/.test(unit) ? `${unit}es` : `${unit}s`}`;
}

/** "Emeka Obi" -> "EO" */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
