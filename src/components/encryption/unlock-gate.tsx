"use client";

import { useState, useCallback, type ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface UnlockGateProps {
  /** Content to render when encryption is unlocked */
  children: ReactNode;
  /** Whether the parent detected an ENCRYPTION_LOCKED error */
  locked: boolean;
  /** Called after a successful unlock so the parent can retry fetching data */
  onUnlocked: () => void;
}

/**
 * Wraps report content with an encryption passphrase prompt.
 * When `locked` is true, shows the passphrase entry form.
 * On successful unlock, calls `onUnlocked()` so the parent can retry.
 */
export function UnlockGate({ children, locked, onUnlocked }: UnlockGateProps) {
  const [passphrase, setPassphrase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!locked) return <>{children}</>;

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/encryption/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const data = await res.json();

      if (data.success) {
        setPassphrase("");
        onUnlocked();
      } else {
        setError(data.error || "Failed to unlock encryption");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-50">
            <Shield size={20} strokeWidth={1.5} className="text-brand-500" />
          </div>
          <div>
            <CardTitle>Unlock Reports</CardTitle>
            <CardDescription>
              Enter your encryption passphrase to decrypt evaluation data
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form className="space-y-4 mt-4" onSubmit={handleUnlock}>
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}

        <Input
          id="unlock-passphrase"
          label="Encryption Passphrase"
          type="password"
          placeholder="Enter your passphrase"
          value={passphrase}
          onChange={(e) => {
            setPassphrase(e.target.value);
            setError("");
          }}
          autoFocus
        />

        <Button
          type="submit"
          disabled={!passphrase || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Unlocking..." : "Unlock"}
        </Button>

        <p className="text-[12px] text-gray-400 text-center leading-relaxed">
          This is the passphrase set during encryption setup.
          Your session will stay unlocked for 4 hours.
        </p>
      </form>
    </Card>
  );
}

/**
 * Hook to check encryption unlock status and handle ENCRYPTION_LOCKED errors.
 */
export function useEncryptionUnlock() {
  const [locked, setLocked] = useState(false);

  const handleApiResponse = useCallback((json: { success: boolean; code?: string }) => {
    if (!json.success && json.code === "ENCRYPTION_LOCKED") {
      setLocked(true);
      return true;
    }
    setLocked(false);
    return false;
  }, []);

  const handleUnlocked = useCallback(() => {
    setLocked(false);
  }, []);

  return { locked, setLocked, handleApiResponse, handleUnlocked };
}
