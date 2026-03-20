import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Driver, Event, Prediction } from "@/types/database";
import PredictionForm from "./PredictionForm";
import Button from "@/components/Button";

function hasEventBegun(event: Event): boolean {
  const dateStr = event.time
    ? `${event.date}T${event.time}`
    : `${event.date}T00:00:00Z`;
  return new Date(dateStr) <= new Date();
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { eventId } = await params;
  const { edit } = await searchParams;
  const supabase = await createClient();

  const [{ data: event }, { data: drivers }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("id", Number(eventId))
      .single<Event>(),
    supabase.from("drivers").select("*").returns<Driver[]>(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/events/${eventId}/predict`)}`);
  }

  let existingPrediction: Prediction | null = null;
  if (user) {
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id)
      .eq("event_id", Number(eventId))
      .maybeSingle<Prediction>();
    existingPrediction = data ?? null;
  }

  if (existingPrediction && edit === undefined) {
    redirect(`/events/${eventId}/predictions?from=/`);
  }

  if (!event || !drivers) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Event not found.
      </div>
    );
  }

  const isLocked = event.predictions_locked || hasEventBegun(event);

  return (
    <div className="animate-fade-in p-6">
      <Button variant="ghost" size="sm" href="/events?from=/predict" className="mb-4">
        &larr; Back
      </Button>
      <PredictionForm
        event={event}
        drivers={drivers}
        existingPrediction={existingPrediction}
        isLocked={isLocked}
      />
    </div>
  );
}
