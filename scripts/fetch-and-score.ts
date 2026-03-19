import { createClient } from "@supabase/supabase-js";
import {
  getQualifyingResults,
  getRaceResults,
  getSprintResults,
  getSeasonCalendar,
  isSprintWeekend,
} from "../src/lib/jolpica/client";
import {
  mapQualifyingResults,
  mapRaceResults,
  mapSprintResults,
} from "../src/lib/jolpica/mapper";
import { computeScores } from "../src/lib/scoring/engine";
import type { Prediction, SessionResult } from "../src/types/database";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const season = process.env.SEASON ?? "current";
const round = process.env.ROUND ?? "last";
const seasonNum = season === "current" ? "current" as const : parseInt(season, 10);
const roundNum = round === "last" ? "last" as const : parseInt(round, 10);

async function findEventId(seasonYear: number, roundNum: number): Promise<number | null> {
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("season_year", seasonYear)
    .eq("round", roundNum)
    .single();

  return data?.id ?? null;
}

async function upsertResults(results: SessionResult[]) {
  if (results.length === 0) return;

  const rows = results.map(({ id: _id, ...rest }) => rest);
  const { error } = await supabase
    .from("session_results")
    .upsert(rows, { onConflict: "event_id,session_type,driver_id" });

  if (error) {
    console.error("Failed to upsert results:", error.message);
    throw error;
  }

  console.log(`Upserted ${rows.length} results`);
}

async function scoreEvent(eventId: number) {
  const { data: predictions, error: predErr } = await supabase
    .from("predictions")
    .select("*")
    .eq("event_id", eventId);

  if (predErr) throw predErr;
  if (!predictions?.length) {
    console.log("No predictions found for this event");
    return;
  }

  const { data: results, error: resErr } = await supabase
    .from("session_results")
    .select("*")
    .eq("event_id", eventId);

  if (resErr) throw resErr;
  if (!results?.length) {
    console.log("No results found yet — skipping scoring");
    return;
  }

  const scores = computeScores(
    predictions as Prediction[],
    results as SessionResult[],
  );

  const rows = scores.map((s) => ({
    ...s,
    computed_at: new Date().toISOString(),
  }));

  const { error: scoreErr } = await supabase
    .from("scores")
    .upsert(rows, { onConflict: "user_id,event_id" });

  if (scoreErr) throw scoreErr;

  const totalPoints = scores.reduce((sum, s) => sum + s.total_points, 0);
  console.log(`Scored ${scores.length} predictions (${totalPoints} total points awarded)`);
}

async function main() {
  console.log(`Fetching results for season=${season} round=${round}`);

  const calendar = await getSeasonCalendar(seasonNum);

  const targetRace =
    roundNum === "last"
      ? calendar[calendar.length - 1]
      : calendar.find((r) => r.round === String(roundNum));

  if (!targetRace) {
    console.error(`Round ${round} not found in ${season} calendar`);
    process.exit(1);
  }

  const actualSeason = parseInt(targetRace.season, 10);
  const actualRound = parseInt(targetRace.round, 10);

  console.log(`Target: ${targetRace.raceName} (Round ${actualRound}, ${actualSeason})`);

  const eventId = await findEventId(actualSeason, actualRound);
  if (!eventId) {
    console.error("Event not found in database — run calendar sync first");
    process.exit(1);
  }

  const qualResults = await getQualifyingResults(actualSeason, actualRound);
  console.log(`Fetched ${qualResults.length} qualifying results`);
  await upsertResults(mapQualifyingResults(eventId, qualResults));

  const raceResults = await getRaceResults(actualSeason, actualRound);
  console.log(`Fetched ${raceResults.length} race results`);
  await upsertResults(mapRaceResults(eventId, raceResults));

  if (isSprintWeekend(targetRace)) {
    const sprintResults = await getSprintResults(actualSeason, actualRound);
    console.log(`Fetched ${sprintResults.length} sprint results`);
    await upsertResults(mapSprintResults(eventId, sprintResults));
  }

  await scoreEvent(eventId);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
