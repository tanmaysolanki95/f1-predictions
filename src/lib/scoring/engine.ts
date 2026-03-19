import type { Prediction, Score, SessionResult } from "@/types/database";

interface ResultsByPosition {
  qualifying: Map<number, string>;
  race: Map<number, string>;
  sprint: Map<number, string>;
}

function buildPositionMaps(results: SessionResult[]): ResultsByPosition {
  const maps: ResultsByPosition = {
    qualifying: new Map(),
    race: new Map(),
    sprint: new Map(),
  };

  for (const r of results) {
    maps[r.session_type].set(r.position, r.driver_id);
  }

  return maps;
}

function checkPrediction(
  positionMap: Map<number, string>,
  position: number,
  predictedDriverId: string | null,
): number {
  if (!predictedDriverId) return 0;
  return positionMap.get(position) === predictedDriverId ? 1 : 0;
}

export function computeScore(
  prediction: Prediction,
  results: SessionResult[],
): Omit<Score, "id" | "computed_at"> {
  const maps = buildPositionMaps(results);

  const race_pole_points = checkPrediction(maps.qualifying, 1, prediction.race_pole_driver_id);
  const race_p1_points = checkPrediction(maps.race, 1, prediction.race_p1_driver_id);
  const race_p2_points = checkPrediction(maps.race, 2, prediction.race_p2_driver_id);
  const race_p3_points = checkPrediction(maps.race, 3, prediction.race_p3_driver_id);
  const race_p10_points = checkPrediction(maps.race, 10, prediction.race_p10_driver_id);

  const sprint_pole_points = checkPrediction(maps.qualifying, 1, prediction.sprint_pole_driver_id);
  const sprint_p1_points = checkPrediction(maps.sprint, 1, prediction.sprint_p1_driver_id);
  const sprint_p2_points = 0;
  const sprint_p3_points = 0;
  const sprint_p10_points = 0;

  const total_points =
    race_pole_points +
    race_p1_points +
    race_p2_points +
    race_p3_points +
    race_p10_points +
    sprint_pole_points +
    sprint_p1_points;

  return {
    user_id: prediction.user_id,
    event_id: prediction.event_id,
    race_pole_points,
    race_p1_points,
    race_p2_points,
    race_p3_points,
    race_p10_points,
    sprint_pole_points,
    sprint_p1_points,
    sprint_p2_points,
    sprint_p3_points,
    sprint_p10_points,
    total_points,
  };
}

export function computeScores(
  predictions: Prediction[],
  results: SessionResult[],
): Omit<Score, "id" | "computed_at">[] {
  return predictions.map((p) => computeScore(p, results));
}
