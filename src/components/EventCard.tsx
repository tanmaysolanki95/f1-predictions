import Card from "./Card";
import Badge from "./Badge";
import FallbackImage from "./FallbackImage";
import { getCountryFlagUrl } from "@/lib/countryFlags";

type EventCardProps = {
  raceName: string;
  date: string;
  circuit: string;
  countryFlag: string;
  sprint?: boolean;
  round?: number;
  isPast?: boolean;
  isNext?: boolean;
};

export default function EventCard({
  raceName,
  date,
  circuit,
  countryFlag,
  sprint,
  round,
  isPast,
  isNext,
}: EventCardProps) {
  const cardClass = `w-full h-full relative overflow-hidden ${isPast ? "opacity-50 grayscale" : ""} ${isNext ? "shadow-[0_0_12px_rgba(225,6,0,0.25)]" : ""}`;
  return (
    <Card className={cardClass}>
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--f1-red)]"/>
      <div className="relative pl-4 pr-4 pt-3 pb-3 h-full flex flex-col">
        <div className="flex items-start justify-between border-b border-[var(--glass-border)] pb-2 mb-2 flex-1">
          <div className="flex items-center gap-3">
            {round !== undefined && (
              <span
                className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-full bg-[var(--f1-red)] text-white text-[0.65rem] font-extrabold leading-none flex-none"
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
          <div className="ml-4" aria-label="country-flag">
            {(() => {
              const flagUrl = getCountryFlagUrl(countryFlag);
              return flagUrl ? (
                <FallbackImage
                  src={flagUrl}
                  alt={countryFlag}
                  width={48}
                  height={32}
                  className="rounded-sm shadow-sm"
                  fallback={<span className="text-2xl" style={{ fontFamily: 'var(--font-titillium)' }}>{countryFlag}</span>}
                />
              ) : (
                <span className="text-2xl" style={{ fontFamily: 'var(--font-titillium)' }}>{countryFlag}</span>
              );
            })()}
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
