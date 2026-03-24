/**
 * Database types — mirrors the Supabase Postgres schema exactly.
 * These are the shapes of rows as they come from / go to the DB.
 */

// ── Profiles ────────────────────────────────────────────────
export interface Profile {
  id: string; // UUID from auth.users
  display_name: string;
  invite_code: string | null;
  created_at: string; // ISO timestamp
}

// ── Seasons ─────────────────────────────────────────────────
export interface Season {
  year: number;
}

// ── Drivers ─────────────────────────────────────────────────
export interface Driver {
  id: string; // Jolpica driverId e.g. 'max_verstappen'
  code: string; // 3-letter e.g. 'VER'
  first_name: string;
  last_name: string;
  team: string | null;
  nationality: string | null;
  number: string | null;
  headshot_url: string | null;
  team_colour: string | null;
}

// ── Events ──────────────────────────────────────────────────
export interface Event {
  id: number;
  season_year: number;
  round: number;
  name: string;
  circuit_id: string;
  circuit_name: string;
  country: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM:SSZ
  is_sprint: boolean;
  predictions_locked: boolean;
}

// ── Session Results ─────────────────────────────────────────
export type SessionType = "qualifying" | "race" | "sprint";

export interface SessionResult {
  id: number;
  event_id: number;
  session_type: SessionType;
  driver_id: string;
  position: number;
  status: string | null;
  grid: number | null;
  points: number | null;
  fetched_at: string;
}

// ── Predictions ─────────────────────────────────────────────
export interface Prediction {
  id: number;
  user_id: string;
  event_id: number;

  // Race qualifying
  race_pole_driver_id: string | null;

  // Race result predictions
  race_p1_driver_id: string | null;
  race_p2_driver_id: string | null;
  race_p3_driver_id: string | null;
  race_p10_driver_id: string | null;

  // Sprint predictions (null for non-sprint weekends)
  sprint_pole_driver_id: string | null;
  sprint_p1_driver_id: string | null;
  sprint_p2_driver_id: string | null;
  sprint_p3_driver_id: string | null;
  sprint_p10_driver_id: string | null;

  created_at: string;
  updated_at: string;
}

// ── Scores ──────────────────────────────────────────────────
export interface Score {
  id: number;
  user_id: string;
  event_id: number;

  race_pole_points: number;
  race_p1_points: number;
  race_p2_points: number;
  race_p3_points: number;
  race_p10_points: number;
  sprint_pole_points: number;
  sprint_p1_points: number;
  sprint_p2_points: number;
  sprint_p3_points: number;
  sprint_p10_points: number;

  total_points: number;
  computed_at: string;
}

// ── Event Sessions ───────────────────────────────────────────
export interface EventSession {
  id: number;
  event_id: number;
  session_type: "fp1" | "fp2" | "fp3" | "sprint_qualifying" | "sprint_race" | "qualifying" | "race";
  date: string;  // YYYY-MM-DD
  time: string;  // HH:MM:SSZ
}

// ── Leaderboard View ────────────────────────────────────────
export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_points: number;
  events_scored: number;
  rank: number;
}

// ── Prediction types for forms ──────────────────────────────
export type PredictionCategory =
  | "race_pole"
  | "race_p1"
  | "race_p2"
  | "race_p3"
  | "race_p10"
  | "sprint_pole"
  | "sprint_p1"
  | "sprint_p2"
  | "sprint_p3"
  | "sprint_p10";

/** Map from prediction category → the driver_id column name in predictions table */
export const PREDICTION_COLUMN_MAP: Record<PredictionCategory, keyof Prediction> = {
  race_pole: "race_pole_driver_id",
  race_p1: "race_p1_driver_id",
  race_p2: "race_p2_driver_id",
  race_p3: "race_p3_driver_id",
  race_p10: "race_p10_driver_id",
  sprint_pole: "sprint_pole_driver_id",
  sprint_p1: "sprint_p1_driver_id",
  sprint_p2: "sprint_p2_driver_id",
  sprint_p3: "sprint_p3_driver_id",
  sprint_p10: "sprint_p10_driver_id",
} as const;

/** Labels for display */
export const PREDICTION_LABELS: Record<PredictionCategory, string> = {
  race_pole: "Qualifying Pole (P1)",
  race_p1: "Race Winner (P1)",
  race_p2: "Race P2",
  race_p3: "Race P3",
  race_p10: "Race P10",
  sprint_pole: "Sprint Qualifying Pole",
  sprint_p1: "Sprint Winner (P1)",
  sprint_p2: "Sprint P2",
  sprint_p3: "Sprint P3",
  sprint_p10: "Sprint P10",
} as const;

export const RACE_CATEGORIES: PredictionCategory[] = [
  "race_pole",
  "race_p1",
  "race_p2",
  "race_p3",
  "race_p10",
];

export const SPRINT_CATEGORIES: PredictionCategory[] = [
  "sprint_pole",
  "sprint_p1",
];
