/**
 * Country name → flag image URL via flagcdn.com.
 *
 * Maps F1 calendar country names (as stored in `events.country`)
 * to ISO 3166-1 alpha-2 codes for flag image lookups.
 */

const COUNTRY_CODES: Record<string, string> = {
  Bahrain: "bh",
  "Saudi Arabia": "sa",
  Australia: "au",
  Japan: "jp",
  China: "cn",
  "United States": "us",
  USA: "us",
  Miami: "us",
  "Las Vegas": "us",
  Italy: "it",
  Monaco: "mc",
  Canada: "ca",
  Spain: "es",
  Austria: "at",
  "United Kingdom": "gb",
  UK: "gb",
  "Great Britain": "gb",
  Hungary: "hu",
  Belgium: "be",
  Netherlands: "nl",
  Azerbaijan: "az",
  Singapore: "sg",
  Mexico: "mx",
  Brazil: "br",
  Qatar: "qa",
  "United Arab Emirates": "ae",
  UAE: "ae",
  "Abu Dhabi": "ae",
  Portugal: "pt",
  France: "fr",
  Germany: "de",
  Russia: "ru",
  Turkey: "tr",
  Türkiye: "tr",
  "South Africa": "za",
  India: "in",
  "South Korea": "kr",
  Korea: "kr",
  Malaysia: "my",
  Emilia: "it",
  "Emilia Romagna": "it",
};

/**
 * Resolve a country name (from the events table) to the flagcdn.com image URL.
 * Returns `null` if the country is not mapped.
 *
 * @param width - Image width in px (default 40, good for inline use)
 */
export function getCountryFlagUrl(
  country: string,
  width: number = 40,
): string | null {
  const code = COUNTRY_CODES[country];
  if (!code) return null;
  return `https://flagcdn.com/w${width}/${code}.png`;
}

/**
 * Resolve a country name to its ISO alpha-2 code.
 */
export function getCountryCode(country: string): string | null {
  return COUNTRY_CODES[country] ?? null;
}
