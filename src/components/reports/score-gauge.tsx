"use client";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

export function ScoreGauge({ score, maxScore = 5 }: ScoreGaugeProps) {
  const isHigh = score >= 4.0;

  return (
    <div className="flex items-baseline justify-center gap-1 py-6">
      <span
        className={`text-display tabular-nums ${isHigh ? "text-accent" : "text-gray-900"}`}
      >
        {score.toFixed(1)}
      </span>
      <span className="text-[16px] text-gray-400 font-medium">
        / {maxScore}.0
      </span>
    </div>
  );
}
