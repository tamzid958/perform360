"use client";

import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Users,
  UserPlus,
  Link2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import type { CsvRow, ParsedRow, ImportResult } from "@/types/import";

type WizardStep = 1 | 2 | 3 | 4;
type FilterType = "all" | "valid" | "skipped" | "warning";

const STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Preview" },
  { num: 3, label: "Confirm" },
  { num: 4, label: "Result" },
] as const;

function parseCsv(text: string): { rows: ParsedRow[]; error?: string } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { rows: [], error: "CSV has no data rows" };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const teamIdx = header.indexOf("team");
  const managerIdx = header.indexOf("manager");
  const emailIdx = header.indexOf("email");

  if (
    nameIdx === -1 ||
    teamIdx === -1 ||
    managerIdx === -1 ||
    emailIdx === -1
  ) {
    return {
      rows: [],
      error: "CSV must have Name, Team, Manager, Email columns",
    };
  }

  const rawRows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim());
    if (!cols[nameIdx]) continue;
    rawRows.push({
      name: cols[nameIdx],
      team: cols[teamIdx] ?? "",
      manager: cols[managerIdx] ?? "",
      email: cols[emailIdx] ?? "",
    });
  }

  if (rawRows.length === 0) {
    return { rows: [], error: "No valid rows found in CSV" };
  }

  // Build manager lookup per team
  const managerNamesPerTeam = new Map<string, Set<string>>();
  for (const row of rawRows) {
    if (row.manager) {
      if (!managerNamesPerTeam.has(row.team)) {
        managerNamesPerTeam.set(row.team, new Set());
      }
      managerNamesPerTeam.get(row.team)!.add(row.manager);
    }
  }

  const validNameSet = new Set(
    rawRows.filter((r) => r.email).map((r) => r.name)
  );

  const parsedRows: ParsedRow[] = rawRows.map((row, idx) => {
    const isManager =
      managerNamesPerTeam.get(row.team)?.has(row.name) ?? false;
    const warnings: string[] = [];

    if (row.manager && !validNameSet.has(row.manager)) {
      warnings.push(`Manager "${row.manager}" not found in CSV`);
    }

    if (!row.email || !row.email.includes("@")) {
      return {
        ...row,
        rowIndex: idx + 2,
        status: "skipped" as const,
        skipReason: "No email address",
        warnings,
        isManager,
        teamRole: isManager ? ("MANAGER" as const) : ("MEMBER" as const),
      };
    }

    return {
      ...row,
      rowIndex: idx + 2,
      status: warnings.length > 0 ? ("warning" as const) : ("valid" as const),
      warnings,
      isManager,
      teamRole: isManager ? ("MANAGER" as const) : ("MEMBER" as const),
    };
  });

  return { rows: parsedRows };
}

function StepIndicator({
  current,
  completed,
}: {
  current: WizardStep;
  completed: Set<number>;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const isActive = step.num === current;
        const isDone = completed.has(step.num);
        return (
          <div key={step.num} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-[#0071e3] text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={16} strokeWidth={2} />
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`text-[13px] font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-gray-200 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon size={20} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-title-small text-gray-900">{value}</p>
          <p className="text-caption">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function TeamsImportPage() {
  const [step, setStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);
  const [showManagerWarnings, setShowManagerWarnings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const validRows = parsedRows.filter((r) => r.status !== "skipped");
  const skippedRows = parsedRows.filter((r) => r.status === "skipped");
  const warningRows = parsedRows.filter((r) => r.status === "warning");
  const uniqueTeams = Array.from(new Set(validRows.map((r) => r.team)));
  const uniqueEmails = Array.from(new Set(validRows.map((r) => r.email.toLowerCase())));

  const filteredRows =
    filter === "all"
      ? parsedRows
      : parsedRows.filter((r) => r.status === filter);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setParseError("Please upload a .csv file");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsv(text);
      if (result.error) {
        setParseError(result.error);
        setParsedRows([]);
      } else {
        setParseError(null);
        setParsedRows(result.rows);
        setCompletedSteps(new Set([1]));
        setStep(2);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const csvRows: CsvRow[] = validRows.map((r) => ({
        name: r.name,
        team: r.team,
        manager: r.manager,
        email: r.email,
      }));

      const res = await fetch("/api/import/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: csvRows }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Import failed");
      }

      setImportResult(json.data);
      setCompletedSteps(new Set([1, 2, 3]));
      setStep(4);
      addToast("Import completed successfully", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Import failed",
        "error"
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Import Teams from CSV"
        description="Upload a CSV file to bulk-create teams, users, and memberships"
      >
        <Link href="/teams">
          <Button variant="ghost">
            <ArrowLeft size={16} strokeWidth={1.5} className="mr-1.5" />
            Back to Teams
          </Button>
        </Link>
      </PageHeader>

      <StepIndicator current={step} completed={completedSteps} />

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card className="max-w-xl mx-auto">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-[#0071e3] bg-blue-50/50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload
              size={40}
              strokeWidth={1.5}
              className="mx-auto text-gray-400 mb-4"
            />
            <p className="text-body-emphasis text-gray-900 mb-1">
              Drop your CSV file here
            </p>
            <p className="text-callout text-gray-500 mb-4">
              or click to browse
            </p>
            <p className="text-caption">
              Expected columns: Name, Team, Manager, Email
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {parseError && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-[14px] flex items-center gap-2">
              <XCircle size={16} strokeWidth={1.5} />
              {parseError}
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText
                size={16}
                strokeWidth={1.5}
                className="text-gray-400"
              />
              <span className="text-callout text-gray-600">{fileName}</span>
              <Badge variant="outline">{parsedRows.length} rows</Badge>
            </div>
            <div className="flex items-center gap-1">
              {(
                [
                  ["all", `All (${parsedRows.length})`],
                  ["valid", `Valid (${validRows.length - warningRows.length})`],
                  ["warning", `Warnings (${warningRows.length})`],
                  ["skipped", `Skipped (${skippedRows.length})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                    filter === key
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">
                      #
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">
                      Name
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">
                      Team
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">
                      Manager
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">
                      Email
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">
                      Role
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={`border-b border-gray-50 ${
                        row.status === "skipped"
                          ? "bg-red-50/50"
                          : row.status === "warning"
                            ? "bg-amber-50/30"
                            : ""
                      }`}
                    >
                      <td className="py-2 px-3 text-gray-400">
                        {row.rowIndex}
                      </td>
                      <td className="py-2 px-3 text-gray-900 font-medium">
                        {row.name}
                      </td>
                      <td className="py-2 px-3 text-gray-600">{row.team}</td>
                      <td className="py-2 px-3 text-gray-600">
                        {row.manager || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {row.email || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <Badge
                          variant={
                            row.teamRole === "MANAGER" ? "info" : "default"
                          }
                        >
                          {row.teamRole === "MANAGER" ? "Manager" : "Member"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        {row.status === "valid" && (
                          <Badge variant="success">Valid</Badge>
                        )}
                        {row.status === "skipped" && (
                          <span
                            className="inline-flex items-center gap-1"
                            title={row.skipReason}
                          >
                            <Badge variant="error">Skipped</Badge>
                          </span>
                        )}
                        {row.status === "warning" && (
                          <span
                            className="inline-flex items-center gap-1"
                            title={row.warnings?.join("; ")}
                          >
                            <Badge variant="warning">Warning</Badge>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={() => {
                setStep(1);
                setParsedRows([]);
                setFileName(null);
                setFilter("all");
                setCompletedSteps(new Set());
              }}
            >
              <ArrowLeft size={16} strokeWidth={1.5} className="mr-1.5" />
              Upload different file
            </Button>
            <Button
              onClick={() => {
                setCompletedSteps(new Set([1, 2]));
                setStep(3);
              }}
              disabled={validRows.length === 0}
            >
              Continue
              <ArrowRight size={16} strokeWidth={1.5} className="ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Teams to create"
              value={uniqueTeams.length}
              icon={Users}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Users to create"
              value={uniqueEmails.length}
              icon={UserPlus}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              label="Memberships"
              value={validRows.length}
              icon={Link2}
              color="bg-purple-50 text-purple-600"
            />
          </div>

          {skippedRows.length > 0 && (
            <Card padding="sm" className="mb-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowSkippedDetails(!showSkippedDetails)}
              >
                <div className="flex items-center gap-2">
                  <XCircle
                    size={16}
                    strokeWidth={1.5}
                    className="text-red-500"
                  />
                  <span className="text-[14px] font-medium text-gray-900">
                    {skippedRows.length} rows will be skipped
                  </span>
                  <span className="text-[13px] text-gray-500">
                    (no email address)
                  </span>
                </div>
                {showSkippedDetails ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {showSkippedDetails && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <ul className="space-y-1">
                    {skippedRows.map((r) => (
                      <li
                        key={r.rowIndex}
                        className="text-[13px] text-gray-600"
                      >
                        {r.name}{" "}
                        <span className="text-gray-400">— {r.team}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {warningRows.length > 0 && (
            <Card padding="sm" className="mb-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowManagerWarnings(!showManagerWarnings)}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    size={16}
                    strokeWidth={1.5}
                    className="text-amber-500"
                  />
                  <span className="text-[14px] font-medium text-gray-900">
                    {warningRows.length} rows have warnings
                  </span>
                  <span className="text-[13px] text-gray-500">
                    (manager not in CSV)
                  </span>
                </div>
                {showManagerWarnings ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {showManagerWarnings && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <ul className="space-y-1">
                    {warningRows.map((r) => (
                      <li
                        key={r.rowIndex}
                        className="text-[13px] text-gray-600"
                      >
                        {r.name}{" "}
                        <span className="text-gray-400">
                          — {r.warnings?.join("; ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          <Card padding="sm" className="mb-6">
            <div className="flex items-center gap-2 text-[14px] text-gray-600">
              <AlertTriangle
                size={16}
                strokeWidth={1.5}
                className="text-gray-400"
              />
              <span>
                All users will be created with <strong>Member</strong> company
                role. Team-level Manager/Member roles will be assigned based on
                the CSV.
              </span>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft size={16} strokeWidth={1.5} className="mr-1.5" />
              Back to Preview
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && importResult && (
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={24} strokeWidth={1.5} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-title-small text-gray-900">
                  Import Complete
                </h2>
                <p className="text-callout text-gray-500">
                  Teams, users, and memberships have been created
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-caption mb-1">Teams</p>
                <p className="text-body-emphasis text-gray-900">
                  {importResult.teamsCreated} created
                  {importResult.teamsExisted > 0 && (
                    <span className="text-gray-400 font-normal">
                      {" "}
                      / {importResult.teamsExisted} existed
                    </span>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-caption mb-1">Users</p>
                <p className="text-body-emphasis text-gray-900">
                  {importResult.usersCreated} created
                  {importResult.usersExisted > 0 && (
                    <span className="text-gray-400 font-normal">
                      {" "}
                      / {importResult.usersExisted} existed
                    </span>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-caption mb-1">Memberships</p>
                <p className="text-body-emphasis text-gray-900">
                  {importResult.membershipsCreated} created
                  {importResult.membershipsExisted > 0 && (
                    <span className="text-gray-400 font-normal">
                      {" "}
                      / {importResult.membershipsExisted} existed
                    </span>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-caption mb-1">Rows Skipped</p>
                <p className="text-body-emphasis text-gray-900">
                  {importResult.rowsSkipped}
                </p>
              </div>
            </div>

            {importResult.managersLinked > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-blue-50 text-[13px] text-blue-700">
                {importResult.managersLinked} external manager(s) linked from
                existing users
              </div>
            )}

            {importResult.managersNotFound.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50">
                <p className="text-[13px] font-medium text-amber-700 mb-1">
                  Managers not found ({importResult.managersNotFound.length})
                </p>
                <p className="text-[12px] text-amber-600">
                  These managers were referenced in the CSV but don&apos;t exist
                  as users. Add them manually:
                </p>
                <ul className="mt-1 space-y-0.5">
                  {importResult.managersNotFound.map((name) => (
                    <li key={name} className="text-[12px] text-amber-700">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <div className="flex items-center justify-center gap-3">
            <Link href="/teams">
              <Button>Go to Teams</Button>
            </Link>
            <Link href="/people">
              <Button variant="secondary">View People</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
