export type ReleaseType = "album" | "single" | "ep";

export function classifyReleaseType(
  albumType: string,
  totalTracks: number,
): ReleaseType {
  if (albumType === "album") return "album";
  if (totalTracks >= 3 && totalTracks <= 6) return "ep";
  return "single";
}

export function parseReleaseDate(date: string, precision: string): string {
  if (precision === "year") return `${date}-01-01`;
  if (precision === "month") return `${date}-01`;
  return date;
}
