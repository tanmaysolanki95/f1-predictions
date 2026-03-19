import ProfileTabs from "./ProfileTabs";
import Button from "@/components/Button";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Event, Prediction, Score, Driver } from "@/types/database";

type EventSummary = Pick<Event, "id" | "season_year" | "round" | "name" | "circuit_name" | "country" | "date" | "is_sprint">;

type EventWithPicks = {
  event: {
    id: number;
    round: number;
    name: string;
    circuit_name: string;
    country: string;
    date: string;
    is_sprint: boolean;
  };
  prediction: {
    pole: string;
    p1: string;
    p2: string;
    p3: string;
    p10: string;
    sprintPole?: string;
    sprintP1?: string;
  } | null;
  score: {
    total: number;
    racePoints: number;
    sprintPoints: number;
    breakdown: Record<string, number>;
  } | null;
};

function resolveCode(driverId: string | null, driversMap: Map<string, string>): string {
  if (!driverId) return "\u2014";
  return driversMap.get(driverId) ?? "\u2014";
}

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();

  const [profileRes, seasonsRes, eventsRes, predictionsRes, scoresRes, driversRes, authRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single<Profile>(),
    supabase.from("seasons").select("year").order("year", { ascending: false }).returns<{ year: number }[]>(),
    supabase.from("events").select("id, season_year, round, name, circuit_name, country, date, is_sprint").order("round", { ascending: true }).returns<EventSummary[]>(),
    supabase.from("predictions").select("*").eq("user_id", userId).returns<Prediction[]>(),
    supabase.from("scores").select("*").eq("user_id", userId).returns<Score[]>(),
    supabase.from("drivers").select("id, code").returns<Pick<Driver, "id" | "code">[]>(),
    supabase.auth.getUser(),
  ]);

  const profile = profileRes.data;
  if (!profile) {
    return (
      <div className="flex items-center justify-center text-white h-64">
        User not found.
      </div>
    );
  }

  const seasons = seasonsRes.data ?? [];
  const events = eventsRes.data ?? [];
  const predictions = predictionsRes.data ?? [];
  const scores = scoresRes.data ?? [];
  const drivers = driversRes.data ?? [];
  const currentUser = authRes.data.user;
  const currentYear = new Date().getFullYear();
  const isOwnProfile = currentUser?.id === userId;

  const driversMap = new Map<string, string>();
  for (const d of drivers) {
    driversMap.set(d.id, d.code);
  }

  const predictionsMap = new Map<number, Prediction>();
  for (const p of predictions) {
    predictionsMap.set(p.event_id, p);
  }

  const scoresMap = new Map<number, Score>();
  for (const s of scores) {
    scoresMap.set(s.event_id, s);
  }

  const eventsBySeason = new Map<number, EventSummary[]>();
  for (const ev of events) {
    if (!eventsBySeason.has(ev.season_year)) eventsBySeason.set(ev.season_year, []);
    eventsBySeason.get(ev.season_year)!.push(ev);
  }

  const seasonData: Record<number, EventWithPicks[]> = {};
  for (const [year, yearEvents] of eventsBySeason) {
    yearEvents.sort((a, b) => a.round - b.round);
    seasonData[year] = yearEvents.map((ev) => {
      const pred = predictionsMap.get(ev.id);
      const score = scoresMap.get(ev.id);
      const r = (dId: string | null) => resolveCode(dId, driversMap);

      return {
        event: {
          id: ev.id,
          round: ev.round,
          name: ev.name,
          circuit_name: ev.circuit_name,
          country: ev.country,
          date: ev.date,
          is_sprint: ev.is_sprint,
        },
        prediction: pred ? {
          pole: r(pred.race_pole_driver_id),
          p1: r(pred.race_p1_driver_id),
          p2: r(pred.race_p2_driver_id),
          p3: r(pred.race_p3_driver_id),
          p10: r(pred.race_p10_driver_id),
          sprintPole: ev.is_sprint ? r(pred.sprint_pole_driver_id) : undefined,
          sprintP1: ev.is_sprint ? r(pred.sprint_p1_driver_id) : undefined,
        } : null,
        score: score ? {
          total: score.total_points,
          racePoints: score.race_pole_points + score.race_p1_points + score.race_p2_points + score.race_p3_points + score.race_p10_points,
          sprintPoints: score.sprint_pole_points + score.sprint_p1_points,
          breakdown: {
            pole: score.race_pole_points,
            p1: score.race_p1_points,
            p2: score.race_p2_points,
            p3: score.race_p3_points,
            p10: score.race_p10_points,
            sprintPole: score.sprint_pole_points,
            sprintP1: score.sprint_p1_points,
          },
        } : null,
      };
    });
  }

  const seasonsArray = seasons.map((s) => s.year);
  const totalPoints = scores.reduce((acc, s) => acc + (s.total_points ?? 0), 0);
  const totalPredictions = predictions.length;

  return (
    <main className="p-6 text-white animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" href="/">
          &larr; Back
        </Button>

        <section className="px-4 py-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--glass-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>
                {profile.display_name}
              </h1>
              {isOwnProfile && <span className="text-sm text-white/70">(You)</span>}
            </div>
            <div className="text-sm text-white/70">
              <strong>{totalPoints}</strong> pts
              <span className="ml-3">{totalPredictions} events predicted</span>
            </div>
          </div>
        </section>

        <ProfileTabs
          seasons={seasonsArray}
          currentSeason={currentYear}
          seasonData={seasonData}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </main>
  );
}
