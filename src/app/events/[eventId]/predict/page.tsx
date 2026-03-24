import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Driver, Event, EventSession, Prediction } from "@/types/database";
import PredictionForm from "./PredictionForm";
import Button from "@/components/Button";

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

  const [{ data: event }, { data: drivers }, fp1Session, { data: { user } }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("id", Number(eventId))
      .single<Event>(),
    supabase.from("drivers").select("*").returns<Driver[]>(),
    supabase
      .from("event_sessions")
      .select("date, time")
      .eq("event_id", Number(eventId))
      .eq("session_type", "fp1")
      .maybeSingle()
      .then((r) => r.data as Pick<EventSession, "date" | "time"> | null),
    supabase.auth.getUser(),
  ]);

  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/events/${eventId}/predict`)}`);
  }

  const { data: existingPrediction } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id)
    .eq("event_id", Number(eventId))
    .maybeSingle<Prediction>();

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

  const fp1DateTime = fp1Session
    ? new Date(`${fp1Session.date}T${fp1Session.time}`)
    : new Date(`${event.date}T00:00:00Z`);
  const isLocked = event.predictions_locked || fp1DateTime <= new Date();

  return (
    <div className="animate-fade-in p-6">
      <Button variant="ghost" size="sm" href="/events?from=/predict" className="mb-4">
        &larr; Back
      </Button>
      <PredictionForm
        event={event}
        drivers={drivers}
        existingPrediction={existingPrediction ?? null}
        isLocked={isLocked}
      />
    </div>
  );
}
