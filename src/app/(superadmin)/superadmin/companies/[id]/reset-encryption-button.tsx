"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

export function ResetEncryptionButton({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [resetting, setResetting] = useState(false);
  const { addToast } = useToast();

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch(
        `/api/admin/companies/${companyId}/reset-encryption`,
        { method: "POST" }
      );
      const json = await res.json();
      if (json.success) {
        setOpen(false);
        addToast("Encryption reset — company can set up encryption again", "success");
        window.location.reload();
      } else {
        addToast(json.error ?? "Failed to reset encryption", "error");
      }
    } catch {
      addToast("Failed to reset encryption", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="border-red-300 bg-red-100 text-red-700 hover:bg-red-200"
        onClick={() => {
          setOpen(true);
          setConfirmName("");
        }}
      >
        Reset Encryption
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">
              Reset Encryption
            </DialogTitle>
            <DialogDescription>
              This will delete the encryption key, salt, and all recovery codes
              for <strong>{companyName}</strong>. The company admin will need to
              set up encryption again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-3">
              <AlertTriangle
                size={18}
                strokeWidth={1.5}
                className="text-red-500 mt-0.5 shrink-0"
              />
              <p className="text-[13px] text-red-700">
                Any previously encrypted evaluation responses will become{" "}
                <strong>permanently unreadable</strong>. Active cycles will lose
                their cached encryption key and submissions will fail until the
                admin re-activates.
              </p>
            </div>
            <Input
              id="confirm-company-name"
              label={`Type "${companyName}" to confirm`}
              placeholder={companyName}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReset}
                disabled={
                  resetting ||
                  confirmName.trim().toLowerCase() !==
                    companyName.trim().toLowerCase()
                }
              >
                {resetting ? "Resetting..." : "Reset Encryption"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
