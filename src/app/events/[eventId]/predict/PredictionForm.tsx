"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DriverCard from "@/components/DriverCard";
import DriverPickerModal from "@/components/DriverPickerModal";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import type { Driver, Event, Prediction, PredictionCategory } from "@/types/database";
import {
  RACE_CATEGORIES,
  SPRINT_CATEGORIES,
  PREDICTION_LABELS,
  PREDICTION_COLUMN_MAP,
} from "@/types/database";

type Props = {
  event: Event;
  drivers: Driver[];
  existingPrediction: Prediction | null;
  isLocked: boolean;
};

type FormValues = Partial<Record<PredictionCategory, string>>;

function buildInitialValues(prediction: Prediction | null): FormValues {
  if (!prediction) return {};
  const values: FormValues = {};
  for (const [cat, col] of Object.entries(PREDICTION_COLUMN_MAP)) {
    const v = prediction[col] as string | null;
    if (v) values[cat as PredictionCategory] = v;
  }
  return values;
}

export default function PredictionForm({ event, drivers, existingPrediction, isLocked }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() =>
    buildInitialValues(existingPrediction),
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const locked = isLocked;

  const setField = (cat: PredictionCategory, driverId: string) => {
    setValues((prev) => ({ ...prev, [cat]: driverId }));
  };

  const [pickerCat, setPickerCat] = useState<PredictionCategory | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFeedback({ type: "error", message: "You must be logged in." });
        return;
      }

      const row: Record<string, string | number | null> = {
        user_id: user.id,
        event_id: event.id,
      };

      for (const cat of RACE_CATEGORIES) {
        row[PREDICTION_COLUMN_MAP[cat]] = values[cat] ?? null;
      }

      if (event.is_sprint) {
        for (const cat of SPRINT_CATEGORIES) {
          row[PREDICTION_COLUMN_MAP[cat]] = values[cat] ?? null;
        }
      } else {
        for (const cat of SPRINT_CATEGORIES) {
          row[PREDICTION_COLUMN_MAP[cat]] = null;
        }
      }

      const { error } = await supabase
        .from("predictions")
        .upsert(row, { onConflict: "user_id,event_id" });

      if (error) throw error;
      router.push(`/events/${event.id}/predictions`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save predictions.";
      setFeedback({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const renderSlot = (cat: PredictionCategory) => {
    const selectedId = values[cat];
    const driver = drivers.find((d) => d.id === selectedId) ?? null;
    return (
      <div key={cat} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 w-full">
        <span className="text-xs sm:text-sm sm:w-48 sm:shrink-0 text-gray-300" style={{ fontFamily: 'var(--font-titillium)' }}>{PREDICTION_LABELS[cat]}</span>
        <div className="flex-1">
          {driver ? (
            <DriverCard
              driver={driver}
              compact
              className={`w-full ${locked ? "opacity-75" : ""}`}
              onClick={locked ? undefined : () => setPickerCat(cat)}
              selected={!locked && driver?.id === selectedId}
            />
          ) : (
            <div
              onClick={locked ? undefined : () => setPickerCat(cat)}
              className={`min-h-[52px] border-2 border-dashed rounded-[var(--radius-md)] flex items-center justify-center text-xs sm:text-sm transition-colors ${
                locked
                  ? "border-[var(--border)] text-white/30 cursor-default"
                  : "border-[var(--glass-border)] text-white/60 cursor-pointer racing-stripe-bg hover:bg-white/5"
              }`}
            >
              {locked ? "No prediction made" : `Tap to select`}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)', color: 'white' }}>{event.name}</h1>
          <div className="flex items-center gap-2">
            {locked && <Badge label="Locked" tone="locked" />}
            {event.is_sprint && <Badge label="Sprint Weekend" tone="sprint" />}
          </div>
        </div>

        {locked && (
          <div className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] bg-amber-500/10 border border-amber-500/20">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <rect x="3" y="9" width="14" height="9" rx="2" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
              <path d="M6 9V6a4 4 0 1 1 8 0v3" stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-300" style={{ fontFamily: 'var(--font-titillium)' }}>Predictions are locked</p>
              <p className="text-xs text-amber-300/70">
                {event.predictions_locked
                  ? "This event has been manually locked by the organizer."
                  : "This event has already begun. Predictions can no longer be changed."}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Race Predictions">
            <fieldset disabled={locked} className="space-y-4">
              {RACE_CATEGORIES.map(renderSlot)}
            </fieldset>
          </Card>

          {event.is_sprint && (
            <Card title="Sprint Predictions" badge={<Badge label="Sprint" tone="sprint" />}> 
              <fieldset disabled={locked} className="space-y-4">
                {SPRINT_CATEGORIES.map(renderSlot)}
              </fieldset>
            </Card>
          )}

          {pickerCat && (
            <DriverPickerModal
              open={true}
              onClose={() => setPickerCat(null)}
              drivers={drivers}
              onSelect={(id: string) => {
                if (pickerCat) {
                  setField(pickerCat, id);
                  setPickerCat(null);
                }
              }}
              selectedId={values[pickerCat] ?? undefined}
              title={PREDICTION_LABELS[pickerCat]}
            />
          )}

          {feedback && (
            <div
              className={
                feedback.type === "success"
                  ? "p-3 rounded-[var(--radius-md)] bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                  : "p-3 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              }
            >
              {feedback.message}
            </div>
          )}
          
          <Button type="submit" variant="primary" size="lg" loading={saving} disabled={locked || saving} className="w-full">
            {locked ? "Predictions Locked" : saving ? "Saving..." : "Save Predictions"}
          </Button>
        </form>
      </div>
    </div>
  );
}
