import type {
  RacesResponse,
  QualifyingResponse,
  ResultsResponse,
  SprintResponse,
  DriversResponse,
  JolpicaRaceSchedule,
  JolpicaQualifyingResult,
  JolpicaRaceResult,
  JolpicaSprintResult,
  JolpicaDriver,
} from "./types";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

class JolpicaApiError extends Error {
  constructor(
    public status: number,
    public endpoint: string,
  ) {
    super(`Jolpica API ${status} at ${endpoint}`);
    this.name = "JolpicaApiError";
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new JolpicaApiError(res.status, path);
  }

  return res.json() as Promise<T>;
}

export async function getSeasonCalendar(
  season: number | "current" = "current",
): Promise<JolpicaRaceSchedule[]> {
  const data = await fetchJson<RacesResponse>(`/${season}.json?limit=100`);
  return data.MRData.RaceTable.Races;
}

export async function getQualifyingResults(
  season: number | "current",
  round: number | "last",
): Promise<JolpicaQualifyingResult[]> {
  const data = await fetchJson<QualifyingResponse>(
    `/${season}/${round}/qualifying.json?limit=100`,
  );
  const race = data.MRData.RaceTable.Races[0];
  return race?.QualifyingResults ?? [];
}

export async function getRaceResults(
  season: number | "current",
  round: number | "last",
): Promise<JolpicaRaceResult[]> {
  const data = await fetchJson<ResultsResponse>(
    `/${season}/${round}/results.json?limit=100`,
  );
  const race = data.MRData.RaceTable.Races[0];
  return race?.Results ?? [];
}

export async function getSprintResults(
  season: number | "current",
  round: number | "last",
): Promise<JolpicaSprintResult[]> {
  const data = await fetchJson<SprintResponse>(
    `/${season}/${round}/sprint.json?limit=100`,
  );
  const race = data.MRData.RaceTable.Races[0];
  return race?.SprintResults ?? [];
}

export async function getDrivers(
  season: number | "current" = "current",
): Promise<JolpicaDriver[]> {
  const data = await fetchJson<DriversResponse>(
    `/${season}/drivers.json?limit=100`,
  );
  return data.MRData.DriverTable.Drivers;
}

export function isSprintWeekend(race: JolpicaRaceSchedule): boolean {
  return !!(race.Sprint || race.SprintQualifying || race.SprintShootout);
}

export { JolpicaApiError };
