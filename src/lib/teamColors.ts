/**
 * Single source of truth for F1 team colors (2026 season).
 *
 * Drivers store team_colour in the DB (hex without '#').
 * This map is used as a fallback when the DB value is missing.
 *
 * Sources: formula1.com, f1-graphics-css, Jolpica API
 */

export const TEAM_COLORS: Record<string, string> = {
  // Constructor names as they appear in the `drivers.team` column
  Mercedes: "27F4D2",
  Ferrari: "E80020",
  McLaren: "FF8000",
  "Red Bull": "3671C6",
  "Red Bull Racing": "3671C6",
  Haas: "B6BABD",
  "Haas F1 Team": "B6BABD",
  "RB F1 Team": "6692FF",
  "Racing Bulls": "6692FF",
  Alpine: "0093CC",
  "Alpine F1 Team": "0093CC",
  Williams: "1868DB",
  "Aston Martin": "229971",
  Audi: "F50537",
  Cadillac: "1B1F23",
  "Cadillac F1 Team": "1B1F23",
};

/**
 * Resolve the hex color (without '#') for a given driver.
 * Priority: driver.team_colour (from DB) → TEAM_COLORS fallback → neutral gray.
 */
export function resolveTeamColor(driver: {
  team_colour?: string | null;
  team?: string | null;
}): string {
  if (driver.team_colour) return driver.team_colour;
  return (driver.team && TEAM_COLORS[driver.team]) ?? "555555";
}

/**
 * Returns a CSS-ready hex string (with '#' prefix).
 */
export function teamColorHex(driver: {
  team_colour?: string | null;
  team?: string | null;
}): string {
  return `#${resolveTeamColor(driver)}`;
}
