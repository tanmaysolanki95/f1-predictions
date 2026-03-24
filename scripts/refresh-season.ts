import { createClient } from "@supabase/supabase-js";
import {
  getSeasonCalendar,
  getDrivers,
  getDriverStandings,
  JolpicaApiError,
} from "../src/lib/jolpica/client";
import { mapDriver, mapEvent } from "../src/lib/jolpica/mapper";
import type { JolpicaRaceSchedule } from "../src/lib/jolpica/types";
import type { Driver } from "../src/types/database";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const season = process.env.SEASON;
if (!season || !/^\d{4}$/.test(season)) {
  console.error("SEASON env var is required (4-digit year, e.g. SEASON=2027)");
  process.exit(1);
}
const seasonYear = parseInt(season, 10);

async function upsertSeason(year: number) {
  const { error } = await supabase
    .from("seasons")
    .upsert({ year }, { onConflict: "year" });

  if (error) throw error;
  console.log(`Season ${year} upserted`);
}

async function upsertEvents(seasonYear: number, calendar: JolpicaRaceSchedule[]) {
  if (calendar.length === 0) {
    console.log(`No races found for ${seasonYear} — calendar may not be published yet`);
    return 0;
  }

  const rows = calendar.map((race) => {
    const event = mapEvent(race, seasonYear);
    const { id: _id, predictions_locked: _locked, ...row } = event;
    return row;
  });

  const { error } = await supabase
    .from("events")
    .upsert(rows, { onConflict: "season_year,round" });

  if (error) throw error;
  console.log(`Upserted ${rows.length} events for ${seasonYear}`);
  return rows.length;
}

async function buildTeamMap(seasonYear: number): Promise<Map<string, string>> {
  const teamMap = new Map<string, string>();

  try {
    const standings = await getDriverStandings(seasonYear);
    for (const s of standings) {
      const team = s.Constructors[0]?.name;
      if (team) teamMap.set(s.Driver.driverId, team);
    }
    if (teamMap.size > 0) {
      console.log(`Got team info for ${teamMap.size} drivers from ${seasonYear} standings`);
      return teamMap;
    }
  } catch (err) {
    if (err instanceof JolpicaApiError) {
      console.log(`No driver standings for ${seasonYear} yet — trying ${seasonYear - 1}`);
    } else {
      throw err;
    }
  }

  try {
    const prevStandings = await getDriverStandings(seasonYear - 1);
    for (const s of prevStandings) {
      const team = s.Constructors[0]?.name;
      if (team) teamMap.set(s.Driver.driverId, team);
    }
    if (teamMap.size > 0) {
      console.log(`Got team info for ${teamMap.size} drivers from ${seasonYear - 1} standings`);
    }
  } catch {
    console.log(`No standings available for ${seasonYear - 1} either — skipping team info`);
  }

  return teamMap;
}

async function upsertDrivers(seasonYear: number) {
  let apiDrivers;
  try {
    apiDrivers = await getDrivers(seasonYear);
  } catch (err) {
    if (err instanceof JolpicaApiError) {
      console.log(`No driver list for ${seasonYear} yet — skipping driver refresh`);
      return 0;
    }
    throw err;
  }

  if (apiDrivers.length === 0) {
    console.log(`Empty driver list for ${seasonYear}`);
    return 0;
  }

  const teamMap = await buildTeamMap(seasonYear);

  const { data: existingDrivers } = await supabase
    .from("drivers")
    .select("id, headshot_url, team_colour");

  const existingMap = new Map<string, { headshot_url: string | null; team_colour: string | null }>();
  for (const d of existingDrivers ?? []) {
    existingMap.set(d.id, { headshot_url: d.headshot_url, team_colour: d.team_colour });
  }

  const rows: Omit<Driver, "">[] = apiDrivers.map((d) => {
    const mapped = mapDriver(d, teamMap.get(d.driverId));
    const existing = existingMap.get(d.driverId);
    return {
      ...mapped,
      headshot_url: existing?.headshot_url ?? mapped.headshot_url,
      team_colour: existing?.team_colour ?? mapped.team_colour,
    };
  });

  const { error } = await supabase
    .from("drivers")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
  console.log(`Upserted ${rows.length} drivers`);
  return rows.length;
}

async function upsertEventSessions(
  seasonYear: number,
  calendar: JolpicaRaceSchedule[],
) {
  if (calendar.length === 0) {
    console.log("No calendar data — skipping session upsert");
    return;
  }

  // Get DB event IDs keyed by round number
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, round")
    .eq("season_year", seasonYear);
  if (eventsError) throw eventsError;

  const eventIdByRound = new Map<number, number>();
  for (const e of events ?? []) {
    eventIdByRound.set(e.round, e.id);
  }

  type SessionRow = { event_id: number; session_type: string; date: string; time: string };
  const sessions: SessionRow[] = [];

  for (const race of calendar) {
    const round = parseInt(race.round, 10);
    const eventId = eventIdByRound.get(round);
    if (!eventId) continue;

    // Race itself (from base fields)
    if (race.date && race.time) {
      sessions.push({ event_id: eventId, session_type: "race", date: race.date, time: race.time });
    }

    // Map optional session fields — skip if missing
    const mappings: Array<[{ date: string; time: string } | undefined, string]> = [
      [race.FirstPractice,                              "fp1"],
      [race.SecondPractice,                             "fp2"],
      [race.ThirdPractice,                              "fp3"],
      [race.Qualifying,                                 "qualifying"],
      [race.Sprint,                                     "sprint_race"],
      [race.SprintQualifying ?? race.SprintShootout,    "sprint_qualifying"],
    ];

    for (const [sessionTime, sessionType] of mappings) {
      if (sessionTime?.date && sessionTime.time) {
        sessions.push({ event_id: eventId, session_type: sessionType, date: sessionTime.date, time: sessionTime.time });
      }
    }
  }

  if (sessions.length === 0) {
    console.log("No session times available in calendar data — skipping session upsert");
    return;
  }

  const { error } = await supabase
    .from("event_sessions")
    .upsert(sessions, { onConflict: "event_id,session_type" });

  if (error) throw error;
  console.log(`Upserted ${sessions.length} event sessions`);
}

async function main() {
  console.log(`\nRefreshing season data for ${seasonYear}\n${"=".repeat(40)}`);

  await upsertSeason(seasonYear);

  const calendar = await getSeasonCalendar(seasonYear);
  const eventCount = await upsertEvents(seasonYear, calendar);
  await upsertEventSessions(seasonYear, calendar);
  const driverCount = await upsertDrivers(seasonYear);

  console.log(`\nDone! Season ${seasonYear}: ${eventCount} events, ${driverCount} drivers`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
