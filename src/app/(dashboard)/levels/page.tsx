"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Layers, Pencil, Trash2, Users } from "lucide-react";

interface Level {
  id: string;
  name: string;
  createdAt: string;
  _count: { teamMembers: number };
}

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Edit dialog
  const [editLevel, setEditLevel] = useState<Level | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog
  const [deleteLevel, setDeleteLevel] = useState<Level | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { addToast } = useToast();

  const fetchLevels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/levels");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load levels");
      setLevels(json.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load levels";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch("/api/levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to create level");
      addToast(`Level "${json.data.name}" created`, "success");
      setShowCreate(false);
      setCreateName("");
      fetchLevels();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to create level", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editLevel || !editName.trim()) return;
    if (editName.trim() === editLevel.name) {
      setEditLevel(null);
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/levels/${editLevel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update level");
      addToast("Level updated", "success");
      setEditLevel(null);
      fetchLevels();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update level", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteLevel) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/levels/${deleteLevel.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete level");
      addToast(`Level "${deleteLevel.name}" deleted`, "success");
      setDeleteLevel(null);
      fetchLevels();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete level", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (error && levels.length === 0) {
    return (
      <div>
        <PageHeader title="Levels" description="Define seniority levels for your organization">
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} strokeWidth={2} className="mr-1.5" />
            New Level
          </Button>
        </PageHeader>
        <ErrorCard message={error} hint="Check your connection and try again" onRetry={fetchLevels} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Levels" description="Define seniority levels for your organization">
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} strokeWidth={2} className="mr-1.5" />
          New Level
        </Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-2 max-w-2xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : levels.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No levels yet"
          description="Create levels like SE L-1, SE L-2 to categorize team members by seniority"
        >
          <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
            Create Level
          </Button>
        </EmptyState>
      ) : (
        <Card className="max-w-2xl divide-y divide-gray-100">
          {levels.map((level) => (
            <div key={level.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-brand-50 shrink-0">
                  <Layers size={16} strokeWidth={1.5} className="text-brand-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-gray-900 truncate">{level.name}</p>
                  <p className="text-[12px] text-gray-500 flex items-center gap-1">
                    <Users size={11} strokeWidth={1.5} />
                    {level._count.teamMembers} member{level._count.teamMembers !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setEditLevel(level);
                    setEditName(level.name);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={`Edit ${level.name}`}
                >
                  <Pencil size={14} strokeWidth={1.5} className="text-gray-400" />
                </button>
                <button
                  onClick={() => setDeleteLevel(level)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  aria-label={`Delete ${level.name}`}
                >
                  <Trash2 size={14} strokeWidth={1.5} className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Create Level Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); setCreateName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Level</DialogTitle>
            <DialogDescription>Add a new seniority level for your organization</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 mt-4"
            onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          >
            <Input
              id="level-name"
              label="Level Name"
              placeholder="e.g. SE L-1, Designer D-2"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              autoFocus
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setCreateName(""); }}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createLoading || !createName.trim()}>
                {createLoading ? "Creating..." : "Create Level"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Level Dialog */}
      <Dialog open={!!editLevel} onOpenChange={(open) => { if (!open) setEditLevel(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Level</DialogTitle>
            <DialogDescription>Rename {editLevel?.name}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 mt-4"
            onSubmit={(e) => { e.preventDefault(); handleEdit(); }}
          >
            <Input
              id="edit-level-name"
              label="Level Name"
              placeholder="e.g. SE L-1"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditLevel(null)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={editLoading || !editName.trim()}>
                {editLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Level Dialog */}
      <Dialog open={!!deleteLevel} onOpenChange={(open) => { if (!open) setDeleteLevel(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Level</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteLevel?.name}&rdquo;?
              {deleteLevel && deleteLevel._count.teamMembers > 0 && (
                <span className="block mt-2 text-amber-600">
                  This level is assigned to {deleteLevel._count.teamMembers} team member(s). You must unassign them first.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setDeleteLevel(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={deleteLoading || (deleteLevel?._count.teamMembers ?? 0) > 0}
              onClick={handleDelete}
            >
              {deleteLoading ? "Deleting..." : "Delete Level"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
