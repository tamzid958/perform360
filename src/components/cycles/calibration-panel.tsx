"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface CalibrationSubject {
  subjectId: string;
  subjectName: string;
  teamId: string;
  teamName: string;
  rawScore: number;
  calibratedScore: number | null;
  justification: string | null;
  adjustedByName: string | null;
  updatedAt: string | null;
}

interface TeamCalibrationSummary {
  teamId: string;
  teamName: string;
  avgRawScore: number;
  avgCalibratedScore: number | null;
  calibrationOffset: number | null;
  calibrationJustification: string | null;
  memberCount: number;
}

interface CalibrationData {
  cycleId: string;
  cycleName: string;
  subjects: CalibrationSubject[];
  teamSummaries: TeamCalibrationSummary[];
}

interface TeamOffsetEdit {
  offset: number;
  justification: string;
}

interface MemberEdit {
  calibratedScore: number;
  justification: string;
}

interface CalibrationPanelProps {
  cycleId: string;
  data: CalibrationData;
  readOnly?: boolean;
  onSaved?: () => void;
}

export function CalibrationPanel({ cycleId, data, readOnly = false, onSaved }: CalibrationPanelProps) {
  const [teamOffsets, setTeamOffsets] = useState<Map<string, TeamOffsetEdit>>(new Map());
  const [memberEdits, setMemberEdits] = useState<Map<string, MemberEdit>>(new Map());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set(data.teamSummaries.map((t) => t.teamId)));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize from existing data
  useEffect(() => {
    const offsets = new Map<string, TeamOffsetEdit>();
    for (const ts of data.teamSummaries) {
      if (ts.calibrationOffset !== null) {
        offsets.set(ts.teamId, {
          offset: ts.calibrationOffset,
          justification: ts.calibrationJustification ?? "",
        });
      }
    }
    setTeamOffsets(offsets);

    const edits = new Map<string, MemberEdit>();
    for (const s of data.subjects) {
      if (s.calibratedScore !== null && s.justification !== null) {
        edits.set(`${s.subjectId}:${s.teamId}`, {
          calibratedScore: s.calibratedScore,
          justification: s.justification,
        });
      }
    }
    setMemberEdits(edits);
  }, [data]);

  const isDirty = teamOffsets.size > 0 || memberEdits.size > 0;

  const toggleTeam = useCallback((teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }, []);

  const updateTeamOffset = useCallback((teamId: string, field: keyof TeamOffsetEdit, value: string | number) => {
    setTeamOffsets((prev) => {
      const next = new Map(prev);
      const existing = next.get(teamId) ?? { offset: 0, justification: "" };
      next.set(teamId, { ...existing, [field]: value });
      return next;
    });
  }, []);

  const updateMemberEdit = useCallback((key: string, field: keyof MemberEdit, value: string | number) => {
    setMemberEdits((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) ?? { calibratedScore: 0, justification: "" };
      next.set(key, { ...existing, [field]: value });
      return next;
    });
  }, []);

  const removeMemberEdit = useCallback((key: string) => {
    setMemberEdits((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const teamAdjustments = Array.from(teamOffsets.entries())
      .filter(([, v]) => v.justification.trim().length > 0)
      .map(([teamId, v]) => ({
        teamId,
        offset: v.offset,
        justification: v.justification.trim(),
      }));

    const memberAdjustments = Array.from(memberEdits.entries())
      .filter(([, v]) => v.justification.trim().length > 0)
      .map(([key, v]) => {
        const [subjectId, teamId] = key.split(":");
        const subject = data.subjects.find((s) => s.subjectId === subjectId && s.teamId === teamId);
        return {
          subjectId,
          teamId,
          rawScore: subject?.rawScore ?? 0,
          calibratedScore: v.calibratedScore,
          justification: v.justification.trim(),
        };
      });

    try {
      const res = await fetch(`/api/cycles/${cycleId}/calibration`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamAdjustments, memberAdjustments }),
      });
      const json = await res.json();
      if (!json.success) {
        setSaveError(json.error ?? "Failed to save");
        return;
      }
      onSaved?.();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Group subjects by team
  const subjectsByTeam = new Map<string, CalibrationSubject[]>();
  for (const s of data.subjects) {
    const existing = subjectsByTeam.get(s.teamId) ?? [];
    existing.push(s);
    subjectsByTeam.set(s.teamId, existing);
  }

  return (
    <div className="space-y-6">
      {/* Cross-team comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.teamSummaries.map((ts) => {
          const offset = teamOffsets.get(ts.teamId);
          const effectiveAvg = offset
            ? parseFloat(Math.min(5, Math.max(0, ts.avgRawScore + offset.offset)).toFixed(2))
            : ts.avgCalibratedScore;

          return (
            <Card key={ts.teamId} padding="sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{ts.teamName}</h4>
                <span className="text-xs text-gray-500">{ts.memberCount} members</span>
              </div>
              <div className="flex items-baseline gap-3">
                <div>
                  <span className="text-xs text-gray-500">Raw Avg</span>
                  <p className="text-lg font-semibold text-gray-900">{ts.avgRawScore.toFixed(2)}</p>
                </div>
                {effectiveAvg !== null && (
                  <div>
                    <span className="text-xs text-gray-500">Calibrated</span>
                    <p className="text-lg font-semibold text-blue-600">{effectiveAvg.toFixed(2)}</p>
                  </div>
                )}
                {offset && (
                  <DeltaBadge value={offset.offset} />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Per-team calibration sections */}
      {data.teamSummaries.map((ts) => {
        const isExpanded = expandedTeams.has(ts.teamId);
        const members = subjectsByTeam.get(ts.teamId) ?? [];
        const offset = teamOffsets.get(ts.teamId);

        return (
          <Card key={ts.teamId} padding="sm">
            <button
              onClick={() => toggleTeam(ts.teamId)}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{ts.teamName}</h3>
                <span className="text-xs text-gray-500">({members.length} members)</span>
                {offset && <DeltaBadge value={offset.offset} />}
              </div>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-4">
                {/* Team-level offset */}
                {!readOnly && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider">Team Offset</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.1"
                          min={-5}
                          max={5}
                          placeholder="0.0"
                          value={offset?.offset ?? ""}
                          onChange={(e) => updateTeamOffset(ts.teamId, "offset", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Justification (e.g., Leniency bias adjustment)"
                          value={offset?.justification ?? ""}
                          onChange={(e) => updateTeamOffset(ts.teamId, "justification", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Member table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="text-center py-2 text-xs font-medium text-gray-500 uppercase w-24">Raw</th>
                        <th className="text-center py-2 text-xs font-medium text-gray-500 uppercase w-32">Calibrated</th>
                        <th className="text-center py-2 text-xs font-medium text-gray-500 uppercase w-16">Delta</th>
                        <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Justification</th>
                        {!readOnly && <th className="w-10"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => {
                        const key = `${member.subjectId}:${member.teamId}`;
                        const edit = memberEdits.get(key);
                        const teamOff = offset?.offset ?? 0;

                        // Effective calibrated score: member edit > team offset > null
                        const effectiveScore = edit
                          ? edit.calibratedScore
                          : teamOff !== 0
                            ? parseFloat(Math.min(5, Math.max(0, member.rawScore + teamOff)).toFixed(2))
                            : member.calibratedScore;
                        const delta = effectiveScore !== null ? effectiveScore - member.rawScore : null;

                        return (
                          <tr key={key} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-2.5 text-gray-900 font-medium">{member.subjectName}</td>
                            <td className="py-2.5 text-center text-gray-700">{member.rawScore.toFixed(2)}</td>
                            <td className="py-2.5 text-center">
                              {readOnly ? (
                                <span className={effectiveScore !== null ? "text-blue-600 font-medium" : "text-gray-400"}>
                                  {effectiveScore?.toFixed(2) ?? "—"}
                                </span>
                              ) : (
                                <Input
                                  type="number"
                                  step="0.1"
                                  min={0}
                                  max={5}
                                  className="w-20 text-center mx-auto"
                                  placeholder={effectiveScore?.toFixed(2) ?? "—"}
                                  value={edit?.calibratedScore ?? ""}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) {
                                      updateMemberEdit(key, "calibratedScore", val);
                                    }
                                  }}
                                />
                              )}
                            </td>
                            <td className="py-2.5 text-center">
                              {delta !== null ? <DeltaBadge value={parseFloat(delta.toFixed(2))} /> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-2.5">
                              {readOnly ? (
                                <span className="text-xs text-gray-500">{edit?.justification ?? member.justification ?? "—"}</span>
                              ) : (
                                <Input
                                  placeholder="Reason for adjustment"
                                  className="text-xs"
                                  value={edit?.justification ?? ""}
                                  onChange={(e) => updateMemberEdit(key, "justification", e.target.value)}
                                />
                              )}
                            </td>
                            {!readOnly && (
                              <td className="py-2.5">
                                {edit && (
                                  <button
                                    onClick={() => removeMemberEdit(key)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title="Remove override"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Save bar */}
      {!readOnly && (
        <div className="sticky bottom-4 z-10">
          <Card padding="sm" className="flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              {saveError && (
                <>
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-sm text-red-600">{saveError}</span>
                </>
              )}
              {!saveError && isDirty && (
                <span className="text-sm text-gray-500">
                  {teamOffsets.size} team offset(s), {memberEdits.size} member override(s)
                </span>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving || !isDirty}>
              <Save size={14} className="mr-1.5" />
              {saving ? "Saving..." : "Save Calibrations"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <Badge
      variant={isPositive ? "success" : "error"}
      className="text-[11px] font-mono"
    >
      {isPositive ? "+" : ""}{value.toFixed(2)}
    </Badge>
  );
}
