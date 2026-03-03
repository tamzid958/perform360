"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Users, MessageCircle } from "lucide-react";
import {
  deriveSelfOtherGap,
  deriveRaterConsensus,
  deriveRelationshipPattern,
} from "@/lib/report-insights";
import type { InsightTileData } from "@/lib/report-insights";
import type { RelationshipScores, QuestionDetail } from "@/types/report";

interface KeyInsightsProps {
  scoresByRelationship: RelationshipScores;
  questionDetails: QuestionDetail[];
}

const ICON_MAP: Record<InsightTileData["iconName"], React.ReactNode> = {
  minus: <Minus size={16} strokeWidth={2} />,
  "trending-up": <TrendingUp size={16} strokeWidth={2} />,
  "trending-down": <TrendingDown size={16} strokeWidth={2} />,
  "message-circle": <MessageCircle size={16} strokeWidth={2} />,
  users: <Users size={16} strokeWidth={2} />,
};

export function KeyInsights({
  scoresByRelationship,
  questionDetails,
}: KeyInsightsProps) {
  const tiles = useMemo(() => {
    const result: InsightTileData[] = [];

    const gap = deriveSelfOtherGap(scoresByRelationship);
    if (gap) result.push(gap);

    const consensus = deriveRaterConsensus(questionDetails);
    if (consensus) result.push(consensus);

    const pattern = deriveRelationshipPattern(scoresByRelationship);
    if (pattern) result.push(pattern);

    return result;
  }, [scoresByRelationship, questionDetails]);

  if (tiles.length === 0) return null;

  return (
    <Card padding="md" className="mb-6">
      <CardHeader>
        <CardTitle>Key Insights</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl bg-gray-50/80 border border-gray-100 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${tile.color}15`, color: tile.color }}
              >
                {ICON_MAP[tile.iconName]}
              </div>
              <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                {tile.label}
              </span>
            </div>
            <p
              className="text-[20px] font-bold leading-tight"
              style={{ color: tile.color }}
            >
              {tile.value}
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {tile.description}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
