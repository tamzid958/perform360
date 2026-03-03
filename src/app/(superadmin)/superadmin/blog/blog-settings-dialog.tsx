"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface BlogSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlogSettingsDialog({ open, onOpenChange }: BlogSettingsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ollamaApiUrl, setOllamaApiUrl] = useState("");
  const [ollamaApiKey, setOllamaApiKey] = useState("");
  const [ollamaModel, setOllamaModel] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/blog/settings");
        const json = await res.json();
        if (json.success) {
          setOllamaApiUrl(json.data.ollamaApiUrl);
          setOllamaModel(json.data.ollamaModel);
          setHasExistingKey(json.data.hasApiKey);
          setOllamaApiKey("");
        }
      } catch {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
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
            <Input
              id="ollama-model"
              label="Preferred Model"
              placeholder="Leave blank to auto-select from available models"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
            />

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
