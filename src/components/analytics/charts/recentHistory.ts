function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseEntryDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getRecentHistory<T extends { date: string }>(
  entries: T[],
  days: number
): T[] {
  const cutoff = startOfDay(new Date());
  cutoff.setDate(cutoff.getDate() - days);

  const recentEntries = entries.filter((entry) => parseEntryDate(entry.date) >= cutoff);

  if (recentEntries.length > 0) {
    return recentEntries;
  }

  return entries.slice(-Math.min(entries.length, days));
}
