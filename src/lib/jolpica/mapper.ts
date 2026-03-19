import type {
  JolpicaRaceSchedule,
  JolpicaQualifyingResult,
  JolpicaRaceResult,
  JolpicaSprintResult,
  JolpicaDriver,
} from "./types";
import type { Driver, Event, SessionResult, SessionType } from "@/types/database";
import { isSprintWeekend } from "./client";

export function mapDriver(d: JolpicaDriver, team?: string): Driver {
  return {
    id: d.driverId,
    code: d.code,
    first_name: d.givenName,
    last_name: d.familyName,
    team: team ?? null,
    nationality: d.nationality,
    number: d.permanentNumber,
    headshot_url: null,
    team_colour: null,
  };
}

export function mapEvent(race: JolpicaRaceSchedule, seasonYear: number): Event {
  return {
    id: 0,
    season_year: seasonYear,
    round: parseInt(race.round, 10),
    name: race.raceName,
    circuit_id: race.Circuit.circuitId,
    circuit_name: race.Circuit.circuitName,
    country: race.Circuit.Location.country,
    date: race.date,
    time: race.time ?? null,
    is_sprint: isSprintWeekend(race),
    predictions_locked: false,
  };
}

function mapResultRow(
  eventId: number,
  sessionType: SessionType,
  driverId: string,
  position: number,
  status: string | undefined,
  grid: string | undefined,
  points: string | undefined,
): SessionResult {
  return {
    id: 0,
    event_id: eventId,
    session_type: sessionType,
    driver_id: driverId,
    position,
    status: status ?? null,
    grid: grid ? parseInt(grid, 10) : null,
    points: points ? parseFloat(points) : null,
    fetched_at: new Date().toISOString(),
  };
}

export function mapQualifyingResults(
  eventId: number,
  results: JolpicaQualifyingResult[],
): SessionResult[] {
  return results.map((r) =>
    mapResultRow(
      eventId,
      "qualifying",
      r.Driver.driverId,
      parseInt(r.position, 10),
      undefined,
      undefined,
      undefined,
    ),
  );
}

export function mapRaceResults(
  eventId: number,
  results: JolpicaRaceResult[],
): SessionResult[] {
  return results.map((r) =>
    mapResultRow(
      eventId,
      "race",
      r.Driver.driverId,
      parseInt(r.position, 10),
      r.status,
      r.grid,
      r.points,
    ),
  );
}

export function mapSprintResults(
  eventId: number,
  results: JolpicaSprintResult[],
): SessionResult[] {
  return results.map((r) =>
    mapResultRow(
      eventId,
      "sprint",
      r.Driver.driverId,
      parseInt(r.position, 10),
      r.status,
      r.grid,
      r.points,
    ),
  );
}
