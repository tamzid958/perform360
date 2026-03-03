"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";

interface BlogSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OllamaModelOption {
  name: string;
  size: number;
  parameterSize?: string;
  family?: string;
}

const AUTO_SELECT_VALUE = "__auto__";

function formatSize(bytes: number): string {
  const gb = bytes / 1_073_741_824;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1_048_576;
  return `${mb.toFixed(0)} MB`;
}

export function BlogSettingsDialog({ open, onOpenChange }: BlogSettingsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ollamaApiUrl, setOllamaApiUrl] = useState("");
  const [ollamaApiKey, setOllamaApiKey] = useState("");
  const [ollamaModel, setOllamaModel] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);

  const [models, setModels] = useState<OllamaModelOption[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState("");

  const fetchModels = useCallback(async (url?: string) => {
    const apiUrl = url ?? ollamaApiUrl;
    if (!apiUrl) return;

    setFetchingModels(true);
    setModelsError("");

    try {
      const body: Record<string, string> = { ollamaApiUrl: apiUrl };
      if (ollamaApiKey) body.ollamaApiKey = ollamaApiKey;

      const res = await fetch("/api/admin/blog/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setModels(json.models);
      } else {
        setModelsError(json.error ?? "Failed to fetch models");
      }
    } catch {
      setModelsError("Network error fetching models");
    } finally {
      setFetchingModels(false);
    }
  }, [ollamaApiUrl, ollamaApiKey]);

  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoading(true);
      setModels([]);
      setModelsError("");
      try {
        const res = await fetch("/api/admin/blog/settings");
        const json = await res.json();
        if (json.success) {
          setOllamaApiUrl(json.data.ollamaApiUrl);
          setOllamaModel(json.data.ollamaModel);
          setHasExistingKey(json.data.hasApiKey);
          setOllamaApiKey("");

          // Auto-fetch models if URL is configured
          if (json.data.ollamaApiUrl) {
            setLoading(false);
            await fetchModelsWithUrl(json.data.ollamaApiUrl);
            return;
          }
        }
      } catch {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    // Separate function to fetch models with a specific URL (avoids stale closure)
    async function fetchModelsWithUrl(url: string) {
      setFetchingModels(true);
      setModelsError("");
      try {
        const res = await fetch("/api/admin/blog/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ollamaApiUrl: url }),
        });
        const json = await res.json();
        if (json.success) {
          setModels(json.models);
        } else {
          setModelsError(json.error ?? "Failed to fetch models");
        }
      } catch {
        setModelsError("Network error fetching models");
      } finally {
        setFetchingModels(false);
      }
    }

    load();
  }, [open]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const body: Record<string, string> = {
        ollamaApiUrl,
        ollamaModel,
      };
      // Only send API key if user entered a new one
      if (ollamaApiKey) {
        body.ollamaApiKey = ollamaApiKey;
      }

      const res = await fetch("/api/admin/blog/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        onOpenChange(false);
      } else {
        setError(json.error ?? "Failed to save settings");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const selectValue = ollamaModel || AUTO_SELECT_VALUE;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Blog Settings</DialogTitle>
          <DialogDescription>
            Configure Ollama API connection for AI article generation
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <form className="space-y-4 mt-4" onSubmit={handleSave}>
            <Input
              id="ollama-api-url"
              label="Ollama API URL"
              placeholder="https://api.ollama.com"
              value={ollamaApiUrl}
              onChange={(e) => setOllamaApiUrl(e.target.value)}
              required
            />
            <Input
              id="ollama-api-key"
              label="Ollama API Key"
              type="password"
              placeholder={hasExistingKey ? "Leave blank to keep current key" : "Enter API key"}
              value={ollamaApiKey}
              onChange={(e) => setOllamaApiKey(e.target.value)}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-gray-700">
                  Preferred Model
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[12px] text-gray-500"
                  disabled={!ollamaApiUrl || fetchingModels}
                  onClick={() => fetchModels()}
                >
                  {fetchingModels ? (
                    <Loader2 size={13} className="mr-1 animate-spin" />
                  ) : (
                    <RefreshCw size={13} className="mr-1" />
                  )}
                  {fetchingModels ? "Fetching…" : "Fetch Models"}
                </Button>
              </div>

              {models.length > 0 ? (
                <Select
                  value={selectValue}
                  onValueChange={(v) =>
                    setOllamaModel(v === AUTO_SELECT_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-select from available" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO_SELECT_VALUE}>
                      Auto-select from available
                    </SelectItem>
                    {models.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name}
                        {m.parameterSize ? ` (${m.parameterSize})` : ""}
                        {m.size ? ` — ${formatSize(m.size)}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-[13px] text-gray-400 py-1.5">
                  {fetchingModels
                    ? "Loading models…"
                    : "Click \u201cFetch Models\u201d to load available options"}
                </p>
              )}

              {modelsError && (
                <p className="text-[12px] text-amber-600">{modelsError}</p>
              )}
            </div>

            {error && (
              <p className="text-[13px] text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 size={16} className="mr-1.5 animate-spin" />}
                Save Settings
              </Button>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
