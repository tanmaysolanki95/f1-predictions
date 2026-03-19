import React from "react";
import Card from "./Card";
import Badge from "./Badge";

type EventCardProps = {
  raceName: string;
  date: string;
  circuit: string;
  countryFlag: string;
  sprint?: boolean;
  round?: number;
};

export default function EventCard({ raceName, date, circuit, countryFlag, sprint, round }: EventCardProps) {
  return (
    <Card className="w-full relative overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--f1-red)]"/>
      <div className="relative pl-4 pr-4 pt-3 pb-3">
        <div className="flex items-start justify-between border-b border-[var(--glass-border)] pb-2 mb-2">
          <div className="flex items-center gap-4">
            {round !== undefined && (
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--f1-red)] text-white font-extrabold"
                style={{ fontFamily: 'var(--font-titillium)' }}
              >
                {`R${round}`}
              </span>
            )}
            <div className="flex-1">
              <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>{raceName}</div>
              <div className="text-sm text-white/70">{circuit}</div>
            </div>
          </div>
          <div className="text-4xl font-bold text-white/90 ml-4" aria-label="country-flag" style={{ fontFamily: 'var(--font-titillium)' }}>
            {countryFlag}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-white/70">{date}</span>
          {sprint && <Badge label="Sprint" tone="sprint" />}
        </div>
      </div>
    </Card>
  );
}
