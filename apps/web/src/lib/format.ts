/**
 * Formats an ISO date (with or without time) as dd/mm/aaaa. Uses the date part
 * as-is, so a date-only value never shifts a day because of the timezone.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

/** Up to two initials for the avatar shown next to the company name. */
export function getInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);

  const firstInitial = words[0]?.[0] ?? "";
  const secondInitial = words[1]?.[0] ?? "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}
