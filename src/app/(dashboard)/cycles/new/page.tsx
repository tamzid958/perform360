"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface TeamOption {
  id: string;
  name: string;
}

interface TemplateOption {
  id: string;
  name: string;
  isGlobal: boolean;
}

interface TeamTemplatePair {
  teamId: string;
  templateId: string;
}

export default function NewCyclePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamTemplates, setTeamTemplates] = useState<TeamTemplatePair[]>([
    { teamId: "", templateId: "" },
  ]);

  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const [teamsRes, templatesRes] = await Promise.all([
          fetch("/api/teams"),
          fetch("/api/templates"),
        ]);
        const teamsData = await teamsRes.json();
        const templatesData = await templatesRes.json();

        if (teamsData.success) setTeams(teamsData.data);
        if (templatesData.success) setTemplates(templatesData.data);
      } catch {
        setFetchError("Failed to load teams or templates");
      }
    }
    loadOptions();
  }, []);

  function addRow() {
    setTeamTemplates((prev) => [...prev, { teamId: "", templateId: "" }]);
  }

  function removeRow(index: number) {
    setTeamTemplates((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: "teamId" | "templateId", value: string) {
    setTeamTemplates((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  const selectedTeamIds = new Set(teamTemplates.map((tt) => tt.teamId).filter(Boolean));
  const isValid =
    name.trim() &&
    startDate &&
    endDate &&
    teamTemplates.length > 0 &&
    teamTemplates.every((tt) => tt.teamId && tt.templateId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate, teamTemplates }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/cycles/${data.data.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Create Evaluation Cycle" description="Set up a new 360° evaluation cycle" />

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="name"
            label="Cycle Name"
            placeholder="e.g. Q1 2026 Performance Review"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              id="startDate"
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              placeholder="Pick start date"
              required
            />
            <DatePicker
              id="endDate"
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              placeholder="Pick end date"
              minDate={startDate ? new Date(startDate) : undefined}
              required
            />
          </div>

          {/* Team-Template Pairs */}
          <div className="space-y-3">
            <label className="block text-[13px] font-medium text-gray-700">
              Team &amp; Template Assignments
            </label>
            <p className="text-[12px] text-gray-500">
              Assign a template to each team participating in this cycle.
            </p>

            {fetchError && (
              <p className="text-[13px] text-red-500">{fetchError}</p>
            )}

            <div className="space-y-3">
              {teamTemplates.map((row, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      value={row.teamId}
                      onValueChange={(v) => updateRow(index, "teamId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem
                            key={team.id}
                            value={team.id}
                            disabled={selectedTeamIds.has(team.id) && row.teamId !== team.id}
                          >
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Select
                      value={row.templateId}
                      onValueChange={(v) => updateRow(index, "templateId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((tmpl) => (
                          <SelectItem key={tmpl.id} value={tmpl.id}>
                            {tmpl.name}
                            {tmpl.isGlobal ? " (Global)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    disabled={teamTemplates.length === 1}
                    className="shrink-0 px-2"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addRow}
              disabled={teamTemplates.length >= teams.length}
            >
              <Plus size={14} strokeWidth={1.5} className="mr-1.5" />
              Add Team
            </Button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading ? "Creating..." : "Create Cycle"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
