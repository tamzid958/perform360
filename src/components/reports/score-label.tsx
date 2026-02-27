"use client";

interface ScoreLabelProps {
  score: number;
  maxScore?: number;
}

function getScoreLabel(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.9) return "Exceptional";
  if (pct >= 0.8) return "Strong Performer";
  if (pct >= 0.7) return "Meets Expectations";
  if (pct >= 0.6) return "Developing";
  if (pct >= 0.4) return "Needs Improvement";
  return "Below Expectations";
}

export function ScoreLabel({ score, maxScore = 5 }: ScoreLabelProps) {
  if (score <= 0) return null;
  const label = getScoreLabel(score, maxScore);
  const isHigh = score >= 4.0;

  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold uppercase tracking-caps px-2 py-0.5 border ${
        isHigh
          ? "text-accent border-accent"
          : "text-gray-900 border-gray-900"
      }`}
    >
      {label}
    </span>
  );
}
