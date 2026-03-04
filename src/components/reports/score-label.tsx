"use client";

interface ScoreLabelProps {
  score: number;
  maxScore?: number;
}

function getScoreLabel(score: number, max: number): { label: string; color: string } {
  const pct = score / max;
  if (pct >= 0.9) return { label: "Exceptional", color: "#248a3d" };
  if (pct >= 0.8) return { label: "Strong Performer", color: "#34c759" };
  if (pct >= 0.7) return { label: "Meets Expectations", color: "#0071e3" };
  if (pct >= 0.6) return { label: "Developing", color: "#ff9f0a" };
  if (pct >= 0.4) return { label: "Needs Improvement", color: "#ff3b30" };
  return { label: "Below Expectations", color: "#d70015" };
}

export function ScoreLabel({ score, maxScore = 5 }: ScoreLabelProps) {
  if (score <= 0) return null;
  const { label, color } = getScoreLabel(score, maxScore);

  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {label}
    </span>
  );
}
