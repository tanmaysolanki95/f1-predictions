import React from "react";

type Props = {
  label: string
  tone?: 'open' | 'sprint' | 'locked' | 'points'
}

const TONE_CLASSES: Record<string, string> = {
  open: "badge--open",
  sprint: "badge--sprint",
  locked: "badge--locked",
  points: "badge--points",
};

export default function Badge({ label, tone = 'open' }: Props) {
  return (
    <span className={`badge ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  )
}
