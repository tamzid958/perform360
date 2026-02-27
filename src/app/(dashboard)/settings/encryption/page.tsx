"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import {
  Shield,
  Key,
  RotateCcw,
  AlertTriangle,
  FileText,
  Copy,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface EncryptionStatus {
  isSetup: boolean;
  setupAt: string | null;
  keyVersion: number;
  remainingRecoveryCodes: number;
}

export default function EncryptionSettingsPage() {
  const { addToast } = useToast();
  const [status, setStatus] = useState<EncryptionStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Change passphrase state
  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  // Recovery state
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryNewPassphrase, setRecoveryNewPassphrase] = useState("");
  const [recoveryConfirmPassphrase, setRecoveryConfirmPassphrase] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);

  // Regenerate dialog state
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regeneratePassphrase, setRegeneratePassphrase] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/encryption/status");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStatus(data.data);
      }
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleChangePassphrase(e: React.FormEvent) {
    e.preventDefault();
    setIsChanging(true);
    try {
      const res = await fetch("/api/encryption/change-passphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassphrase,
          newPassphrase,
          confirmNewPassphrase: confirmPassphrase,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Passphrase updated successfully", "success");
        setCurrentPassphrase("");
        setNewPassphrase("");
        setConfirmPassphrase("");
      } else {
        addToast(data.error || "Failed to update passphrase", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setIsChanging(false);
    }
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setIsRecovering(true);
    try {
      const res = await fetch("/api/encryption/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoveryCode,
          newPassphrase: recoveryNewPassphrase,
          confirmNewPassphrase: recoveryConfirmPassphrase,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Passphrase reset successfully using recovery code", "success");
        setRecoveryCode("");
        setRecoveryNewPassphrase("");
        setRecoveryConfirmPassphrase("");
        fetchStatus();
      } else {
        addToast(data.error || "Recovery failed", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setIsRecovering(false);
    }
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/encryption/recovery-codes/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: regeneratePassphrase }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCodes(data.data.recoveryCodes);
        fetchStatus();
      } else {
        addToast(data.error || "Failed to regenerate codes", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleCopyCodes() {
    await navigator.clipboard.writeText(newCodes.join("\n"));
    setCopied(true);
    addToast("Recovery codes copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadCodes() {
    const content = [
      "Perform360 — Encryption Recovery Codes",
      "Generated: " + new Date().toISOString(),
      "",
      "IMPORTANT: Store these codes in a secure location.",
      "Each code can only be used once.",
      "",
      ...newCodes.map((code, i) => `${i + 1}. ${code}`),
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "perform360-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoadingStatus) {
    return (
      <div>
        <PageHeader title="Encryption Settings" description="Manage your organization's encryption keys and passphrase" />
        <div className="space-y-6 max-w-3xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!status?.isSetup) {
    return (
      <div>
        <PageHeader title="Encryption Settings" description="Manage your organization's encryption keys and passphrase" />
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50">
                <AlertTriangle size={20} strokeWidth={1.5} className="text-amber-500" />
              </div>
              <div>
                <CardTitle>Encryption Not Set Up</CardTitle>
                <CardDescription>You need to set up encryption before evaluation data can be protected</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="mt-4">
            <Link href="/setup-encryption">
              <Button>Set Up Encryption</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Encryption Settings" description="Manage your organization's encryption keys and passphrase" />

      {/* Warning Banner */}
      <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-6 max-w-3xl">
        <AlertTriangle size={20} strokeWidth={1.5} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] font-medium text-amber-800">Critical Security Information</p>
          <p className="text-[13px] text-amber-700 mt-1 leading-relaxed">
            If you lose your encryption passphrase and all recovery codes, evaluation data will be permanently unrecoverable. There is no backdoor. Store your passphrase and recovery codes securely.
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Encryption Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-50">
                <Shield size={20} strokeWidth={1.5} className="text-green-500" />
              </div>
              <div>
                <CardTitle>Encryption Status</CardTitle>
                <CardDescription>AES-256-GCM encryption is active</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-[12px] text-gray-500 uppercase tracking-wider">Algorithm</p>
              <p className="text-[14px] font-medium text-gray-900 mt-1">AES-256-GCM</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 uppercase tracking-wider">Key Version</p>
              <p className="text-[14px] font-medium text-gray-900 mt-1">v{status.keyVersion}</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 uppercase tracking-wider">Set Up</p>
              <p className="text-[14px] font-medium text-gray-900 mt-1">
                {status.setupAt ? formatDate(new Date(status.setupAt)) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 uppercase tracking-wider">Status</p>
              <Badge variant="success" className="mt-1">Active</Badge>
            </div>
          </div>
        </Card>

        {/* Change Passphrase */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-50">
                <Key size={20} strokeWidth={1.5} className="text-brand-500" />
              </div>
              <div>
                <CardTitle>Change Passphrase</CardTitle>
                <CardDescription>Update your encryption passphrase. You must know your current passphrase.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form className="space-y-4 mt-4" onSubmit={handleChangePassphrase}>
            <Input
              id="current-passphrase"
              label="Current Passphrase"
              type="password"
              placeholder="Enter current passphrase"
              value={currentPassphrase}
              onChange={(e) => setCurrentPassphrase(e.target.value)}
            />
            <Input
              id="new-passphrase"
              label="New Passphrase"
              type="password"
              placeholder="Enter new passphrase (12+ characters)"
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
            />
            <Input
              id="confirm-passphrase"
              label="Confirm New Passphrase"
              type="password"
              placeholder="Confirm new passphrase"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              error={confirmPassphrase && newPassphrase !== confirmPassphrase ? "Passphrases do not match" : undefined}
            />
            <Button
              type="submit"
              disabled={
                !currentPassphrase ||
                newPassphrase.length < 12 ||
                newPassphrase !== confirmPassphrase ||
                isChanging
              }
            >
              {isChanging ? "Updating..." : "Update Passphrase"}
            </Button>
          </form>
        </Card>

        {/* Recovery Codes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50">
                <FileText size={20} strokeWidth={1.5} className="text-blue-500" />
              </div>
              <div>
                <CardTitle>Recovery Codes</CardTitle>
                <CardDescription>
                  Recovery codes let you reset your passphrase if you forget it.
                  You have {status.remainingRecoveryCodes} of 8 codes remaining.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="mt-4 flex items-center gap-3">
            <Badge variant={status.remainingRecoveryCodes > 2 ? "success" : status.remainingRecoveryCodes > 0 ? "warning" : "error"}>
              {status.remainingRecoveryCodes} remaining
            </Badge>
            <Button variant="secondary" onClick={() => { setShowRegenerateDialog(true); setNewCodes([]); setRegeneratePassphrase(""); }}>
              Regenerate Recovery Codes
            </Button>
          </div>
        </Card>

        {/* Forgot Passphrase */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50">
                <AlertTriangle size={20} strokeWidth={1.5} className="text-amber-500" />
              </div>
              <div>
                <CardTitle>Forgot Passphrase?</CardTitle>
                <CardDescription>Use a recovery code to set a new encryption passphrase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form className="space-y-4 mt-4" onSubmit={handleRecover}>
            <Input
              id="recovery-code"
              label="Recovery Code"
              type="text"
              placeholder="XXXXX-XXXXX"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
            />
            <Input
              id="recovery-new-passphrase"
              label="New Passphrase"
              type="password"
              placeholder="Enter new passphrase (12+ characters)"
              value={recoveryNewPassphrase}
              onChange={(e) => setRecoveryNewPassphrase(e.target.value)}
            />
            <Input
              id="recovery-confirm-passphrase"
              label="Confirm New Passphrase"
              type="password"
              placeholder="Confirm new passphrase"
              value={recoveryConfirmPassphrase}
              onChange={(e) => setRecoveryConfirmPassphrase(e.target.value)}
              error={recoveryConfirmPassphrase && recoveryNewPassphrase !== recoveryConfirmPassphrase ? "Passphrases do not match" : undefined}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={
                !recoveryCode ||
                recoveryNewPassphrase.length < 12 ||
                recoveryNewPassphrase !== recoveryConfirmPassphrase ||
                isRecovering
              }
            >
              {isRecovering ? "Recovering..." : "Reset Passphrase with Recovery Code"}
            </Button>
          </form>
        </Card>

        {/* Key Rotation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gray-100">
                <RotateCcw size={20} strokeWidth={1.5} className="text-gray-500" />
              </div>
              <div>
                <CardTitle>Key Rotation</CardTitle>
                <CardDescription>Rotate the data encryption key. All existing data will be re-encrypted with the new key.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="mt-4">
            <Button variant="secondary" disabled>Rotate Encryption Key</Button>
            <p className="text-[12px] text-gray-400 mt-2">Coming soon</p>
          </div>
        </Card>
      </div>

      {/* Regenerate Recovery Codes Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newCodes.length > 0 ? "New Recovery Codes" : "Regenerate Recovery Codes"}
            </DialogTitle>
            <DialogDescription>
              {newCodes.length > 0
                ? "Save these new codes in a secure location. This is the only time they will be displayed."
                : "This will invalidate all existing recovery codes. Enter your passphrase to confirm."
              }
            </DialogDescription>
          </DialogHeader>

          {newCodes.length > 0 ? (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-2">
                {newCodes.map((code, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[14px] text-gray-800 text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleCopyCodes} className="flex-1">
                  <Copy size={16} strokeWidth={1.5} className="mr-2" />
                  {copied ? "Copied!" : "Copy All"}
                </Button>
                <Button variant="secondary" onClick={handleDownloadCodes} className="flex-1">
                  <Download size={16} strokeWidth={1.5} className="mr-2" />
                  Download
                </Button>
              </div>
              <Button onClick={() => setShowRegenerateDialog(false)} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle size={16} strokeWidth={1.5} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-amber-700">
                  All existing recovery codes will be invalidated. Make sure you no longer need them.
                </p>
              </div>
              <Input
                id="regenerate-passphrase"
                label="Current Passphrase"
                type="password"
                placeholder="Enter your passphrase to confirm"
                value={regeneratePassphrase}
                onChange={(e) => setRegeneratePassphrase(e.target.value)}
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowRegenerateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRegenerate}
                  disabled={!regeneratePassphrase || isRegenerating}
                  className="flex-1"
                >
                  {isRegenerating ? "Generating..." : "Regenerate Codes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
