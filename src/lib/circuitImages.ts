/**
 * Circuit image URLs — maps circuit_id (Jolpica format) to
 * track layout images from the Formula 1 CDN.
 *
 * Images are rendered as decorative backgrounds / thumbnails.
 * If a URL fails to load, consumers should hide the element gracefully.
 *
 * CDN patterns sourced from marcokreeft87/formulaone-card ImageConstants.
 */

const F1_CDN_BASE =
  "https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9";

/**
 * Map from Jolpica circuit_id → the CDN path suffix used by formula1.com.
 *
 * The suffix is appended after the base CDN URL as: `/{Country}_{CircuitName}`
 * These paths are stable (legacy CDN) and cover recent F1 seasons.
 */
const CIRCUIT_MAP: Record<string, string> = {
  // 2026 calendar circuits
  bahrain: "Bahrain_Circuit",
  jeddah: "Saudi_Arabia_Circuit",
  albert_park: "Australia_Circuit",
  suzuka: "Japan_Circuit",
  shanghai: "China_Circuit",
  miami: "Miami_Circuit",
  imola: "Emilia_Romagna_Circuit",
  monaco: "Monaco_Circuit",
  villeneuve: "Canada_Circuit",
  Circuit_Gilles_Villeneuve: "Canada_Circuit",
  catalunya: "Spain_Circuit",
  red_bull_ring: "Austria_Circuit",
  silverstone: "Great_Britain_Circuit",
  hungaroring: "Hungary_Circuit",
  spa: "Belgium_Circuit",
  zandvoort: "Netherlands_Circuit",
  monza: "Italy_Circuit",
  baku: "Azerbaijan_Circuit",
  marina_bay: "Singapore_Circuit",
  americas: "USA_Circuit",
  rodriguez: "Mexico_Circuit",
  interlagos: "Brazil_Circuit",
  losail: "Qatar_Circuit",
  vegas: "Las_Vegas_Circuit",
  las_vegas: "Las_Vegas_Circuit",
  yas_marina: "Abu_Dhabi_Circuit",
  // Legacy / alternate IDs
  sakhir: "Bahrain_Circuit",
  portimao: "Portugal_Circuit",
  paul_ricard: "France_Circuit",
  nurburgring: "Eifel_Circuit",
  mugello: "Tuscan_Circuit",
  istanbul: "Turkey_Circuit",
  kyalami: "South_Africa_Circuit",
};

/**
 * Get the track layout image URL for a given circuit_id.
 * Returns `null` if the circuit is not mapped.
 */
export function getCircuitImageUrl(circuitId: string): string | null {
  const suffix = CIRCUIT_MAP[circuitId];
  if (!suffix) return null;
  return `${F1_CDN_BASE}/${suffix}.png`;
}

/**
 * All mapped circuit IDs, for validation.
 */
export function getMappedCircuitIds(): string[] {
  return Object.keys(CIRCUIT_MAP);
}
