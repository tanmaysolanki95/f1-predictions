/**
 * Jolpica F1 API response types.
 * Derived from: https://github.com/jolpica/jolpica-f1/tree/main/docs/endpoints
 * Base URL: http://api.jolpi.ca/ergast/f1/
 *
 * The API is Ergast-compatible — all responses wrap in MRData.
 */

// ── Shared types ────────────────────────────────────────────

export interface JolpicaResponse<T extends string, D> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
  } & Record<T, D>;
}

export interface JolpicaLocation {
  lat: string;
  long: string;
  locality: string;
  country: string;
}

export interface JolpicaCircuit {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: JolpicaLocation;
}

export interface JolpicaDriver {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

export interface JolpicaConstructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

// ── Session schedule (from /races/ endpoint) ────────────────

export interface JolpicaSessionTime {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SSZ
}

// ── Race object (base, used by multiple endpoints) ──────────

export interface JolpicaRaceBase {
  season: string;
  round: string;
  url?: string;
  raceName: string;
  Circuit: JolpicaCircuit;
  date: string;
  time?: string;
}

// ── Races / Calendar endpoint ───────────────────────────────
// GET /ergast/f1/{season}/races/

export interface JolpicaRaceSchedule extends JolpicaRaceBase {
  FirstPractice?: JolpicaSessionTime;
  SecondPractice?: JolpicaSessionTime;
  ThirdPractice?: JolpicaSessionTime;
  Qualifying?: JolpicaSessionTime;
  Sprint?: JolpicaSessionTime;
  SprintQualifying?: JolpicaSessionTime;
  SprintShootout?: JolpicaSessionTime; // 2023 format
}

export interface JolpicaRaceTable {
  season?: string;
  round?: string;
  Races: JolpicaRaceSchedule[];
}

export type RacesResponse = JolpicaResponse<"RaceTable", JolpicaRaceTable>;

// ── Qualifying endpoint ─────────────────────────────────────
// GET /ergast/f1/{season}/{round}/qualifying/

export interface JolpicaQualifyingResult {
  number: string;
  position: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface JolpicaRaceWithQualifying extends JolpicaRaceBase {
  QualifyingResults: JolpicaQualifyingResult[];
}

export interface JolpicaQualifyingTable {
  season?: string;
  round?: string;
  Races: JolpicaRaceWithQualifying[];
}

export type QualifyingResponse = JolpicaResponse<"RaceTable", JolpicaQualifyingTable>;

// ── Race Results endpoint ───────────────────────────────────
// GET /ergast/f1/{season}/{round}/results/

export interface JolpicaFastestLap {
  rank: string;
  lap: string;
  Time: { time: string };
  AverageSpeed?: { units: string; speed: string };
}

export interface JolpicaRaceResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: JolpicaDriver;
  Constructor?: JolpicaConstructor;
  grid?: string;
  laps?: string;
  status?: string;
  Time?: { millis: string; time: string };
  FastestLap?: JolpicaFastestLap;
}

export interface JolpicaRaceWithResults extends JolpicaRaceBase {
  Results: JolpicaRaceResult[];
}

export interface JolpicaResultsTable {
  season?: string;
  round?: string;
  Races: JolpicaRaceWithResults[];
}

export type ResultsResponse = JolpicaResponse<"RaceTable", JolpicaResultsTable>;

// ── Sprint Results endpoint ─────────────────────────────────
// GET /ergast/f1/{season}/{round}/sprint/

export interface JolpicaSprintResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: JolpicaDriver;
  Constructor?: JolpicaConstructor;
  grid?: string;
  laps?: string;
  status?: string;
  Time?: { millis: string; time: string };
  FastestLap?: JolpicaFastestLap;
}

export interface JolpicaRaceWithSprint extends JolpicaRaceBase {
  SprintResults: JolpicaSprintResult[];
}

export interface JolpicaSprintTable {
  season?: string;
  round?: string;
  Races: JolpicaRaceWithSprint[];
}

export type SprintResponse = JolpicaResponse<"RaceTable", JolpicaSprintTable>;

// ── Drivers endpoint ────────────────────────────────────────
// GET /ergast/f1/{season}/drivers/

export interface JolpicaDriverTable {
  season?: string;
  Drivers: JolpicaDriver[];
}

export type DriversResponse = JolpicaResponse<"DriverTable", JolpicaDriverTable>;

// ── Driver standings (includes constructor/team per driver) ──
// GET /ergast/f1/{season}/driverstandings/

export interface JolpicaDriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: JolpicaDriver;
  Constructors: JolpicaConstructor[];
}

export interface JolpicaDriverStandingsList {
  season: string;
  round: string;
  DriverStandings: JolpicaDriverStanding[];
}

export interface JolpicaDriverStandingsTable {
  season?: string;
  StandingsLists: JolpicaDriverStandingsList[];
}

export type DriverStandingsResponse = JolpicaResponse<
  "StandingsTable",
  JolpicaDriverStandingsTable
>;

// ── Constructor standings (for team info) ───────────────────
// GET /ergast/f1/{season}/constructorstandings/

export interface JolpicaConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: JolpicaConstructor;
}

export interface JolpicaStandingsList {
  season: string;
  round: string;
  ConstructorStandings: JolpicaConstructorStanding[];
}

export interface JolpicaStandingsTable {
  season?: string;
  StandingsLists: JolpicaStandingsList[];
}

export type ConstructorStandingsResponse = JolpicaResponse<
  "StandingsTable",
  JolpicaStandingsTable
>;
