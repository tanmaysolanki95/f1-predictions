/**
 * Team name → logo image URL via Formula 1 CDN.
 *
 * Maps constructor names (as stored in `drivers.team`) to
 * circular team logo images. Uses the legacy CDN which has
 * predictable URL patterns.
 *
 * CDN base from marcokreeft87/formulaone-card ImageConstants.
 */

const CDN_BASE =
  "https://media.formula1.com/content/dam/fom-website/teams/2025";

/**
 * Map from team display name → CDN slug.
 * The full URL is: `{CDN_BASE}/{slug}-logo.png.transform/2col/image.png`
 */
const TEAM_SLUGS: Record<string, string> = {
  Mercedes: "mercedes",
  Ferrari: "ferrari",
  McLaren: "mclaren",
  "Red Bull": "red-bull-racing",
  "Red Bull Racing": "red-bull-racing",
  Haas: "haas",
  "Haas F1 Team": "haas",
  "RB F1 Team": "rb",
  "Racing Bulls": "rb",
  Alpine: "alpine",
  "Alpine F1 Team": "alpine",
  Williams: "williams",
  "Aston Martin": "aston-martin",
  Audi: "kick-sauber",
  Cadillac: "cadillac",
  "Cadillac F1 Team": "cadillac",
};

/**
 * Get the team logo image URL for a given team name.
 * Returns `null` if the team is not mapped.
 */
export function getTeamLogoUrl(team: string): string | null {
  const slug = TEAM_SLUGS[team];
  if (!slug) return null;
  return `${CDN_BASE}/${slug}-logo.png.transform/2col/image.png`;
}

/**
 * Get all mapped team names, for validation.
 */
export function getMappedTeams(): string[] {
  return Object.keys(TEAM_SLUGS);
}
