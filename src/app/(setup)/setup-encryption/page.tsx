"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/logo";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Shield,
  Key,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const STEPS = ["Introduction", "Set Passphrase", "Recovery Codes", "Complete"];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <p className="text-[12px] font-sans uppercase tracking-widest text-gray-500 text-center">
        Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]}
      </p>
      <div className="flex gap-1.5 mt-3">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 ${
              i + 1 <= currentStep ? "bg-gray-900" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function SetupEncryptionPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Only redirect on initial page load (step 1).
    // Once the user is progressing through setup, skip the check —
    // encryption gets marked as set up in step 2, which would
    // cause a premature redirect on steps 3/4.
    if (step !== 1) return;

    async function checkStatus() {
      const res = await fetch("/api/encryption/status");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data.isSetup) {
          router.replace("/overview");
        }
      }
    }
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passphraseValid =
    passphrase.length >= 12 &&
    passphrase === confirmPassphrase;

  const passphraseStrength = getPassphraseStrength(passphrase);

  async function handleSetup() {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/encryption/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase, confirmPassphrase }),
      });
      const data = await res.json();
      if (data.success) {
        setRecoveryCodes(data.data.recoveryCodes);
        setStep(3);
      } else {
        setError(data.error || "Setup failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyAll() {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    addToast("Recovery codes copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const content = [
      "Performs360 — Encryption Recovery Codes",
      "Generated: " + new Date().toISOString(),
      "",
      "IMPORTANT: Store these codes in a secure location.",
      "Each code can only be used once.",
      "If you lose your passphrase and all recovery codes,",
      "your evaluation data will be permanently unrecoverable.",
      "",
      ...recoveryCodes.map((code, i) => `${i + 1}. ${code}`),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "performs360-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="text-center mb-6">
        <Logo className="h-12 w-auto" />
      </div>

      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield size={20} strokeWidth={1.5} className="text-gray-900" />
              <div>
                <CardTitle className="uppercase tracking-wide font-sans">Secure Your Evaluation Data</CardTitle>
                <CardDescription className="font-serif">Set up end-to-end encryption for your organization</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-4 mt-4">
            <p className="text-[15px] text-gray-700 leading-relaxed font-serif">
              Performs360 uses end-to-end encryption to protect all evaluation responses.
              You need to set an encryption passphrase that will be used to encrypt and decrypt evaluation data.
            </p>

            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-white border border-gray-900">
                <Lock size={18} strokeWidth={1.5} className="text-gray-900 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-gray-900">Your passphrase is never stored</p>
                  <p className="text-[13px] text-gray-500 font-serif">Only you know it — we cannot retrieve it for you</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-white border border-gray-900">
                <Shield size={18} strokeWidth={1.5} className="text-gray-900 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-gray-900">Data encrypted at rest</p>
                  <p className="text-[13px] text-gray-500 font-serif">Encryption is enforced cryptographically, not just by permissions</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-white border border-gray-900">
                <AlertTriangle size={18} strokeWidth={1.5} className="text-gray-900 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-gray-900">If lost, data is permanently unrecoverable</p>
                  <p className="text-[13px] text-gray-500 font-serif">You will receive recovery codes as a backup — store them safely</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={() => setStep(2)} className="w-full">
                Get Started
                <ArrowRight size={16} strokeWidth={1.5} className="ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key size={20} strokeWidth={1.5} className="text-gray-900" />
              <div>
                <CardTitle className="uppercase tracking-wide font-sans">Create Your Encryption Passphrase</CardTitle>
                <CardDescription className="font-serif">Choose a strong passphrase you can remember</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-white border border-gray-900">
                <p className="text-[13px] text-gray-900">{error}</p>
              </div>
            )}

            <Input
              id="passphrase"
              label="Encryption Passphrase"
              type="password"
              placeholder="Enter a passphrase (12+ characters)"
              value={passphrase}
              onChange={(e) => { setPassphrase(e.target.value); setError(""); }}
            />

            {passphrase.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 ${
                        level <= passphraseStrength.level
                          ? passphraseStrength.color
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-[12px] ${passphraseStrength.textColor}`}>
                  {passphraseStrength.label}
                </p>
              </div>
            )}

            <Input
              id="confirm-passphrase"
              label="Confirm Passphrase"
              type="password"
              placeholder="Re-enter your passphrase"
              value={confirmPassphrase}
              onChange={(e) => { setConfirmPassphrase(e.target.value); setError(""); }}
              error={
                confirmPassphrase && passphrase !== confirmPassphrase
                  ? "Passphrases do not match"
                  : undefined
              }
            />

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} strokeWidth={1.5} className="mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSetup}
                disabled={!passphraseValid || isLoading}
                className="flex-1"
              >
                {isLoading ? "Setting up encryption..." : "Set Passphrase & Generate Recovery Codes"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield size={20} strokeWidth={1.5} className="text-gray-900" />
              <div>
                <CardTitle className="uppercase tracking-wide font-sans">Save Your Recovery Codes</CardTitle>
                <CardDescription className="font-serif">These codes can be used to recover your encryption key if you forget your passphrase</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-4 mt-4">
            <div className="flex gap-3 p-3 bg-white border border-gray-900">
              <AlertTriangle size={18} strokeWidth={1.5} className="text-gray-900 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-gray-900 leading-relaxed font-serif">
                Each code can only be used once. Store them in a secure location like a password manager.
                This is the only time these codes will be displayed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, i) => (
                <div
                  key={i}
                  className="px-3 py-2 bg-white border border-gray-900 font-mono text-[14px] text-gray-900 text-center"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleCopyAll} className="flex-1">
                <Copy size={16} strokeWidth={1.5} className="mr-2" />
                {copied ? "Copied!" : "Copy All"}
              </Button>
              <Button variant="secondary" onClick={handleDownload} className="flex-1">
                <Download size={16} strokeWidth={1.5} className="mr-2" />
                Download
              </Button>
            </div>

            <label className="flex items-start gap-3 p-3 bg-white border border-gray-900 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 border-gray-900 text-gray-900 focus:ring-gray-900/40"
              />
              <span className="text-[13px] text-gray-700 leading-relaxed font-serif">
                I have saved these recovery codes in a secure location. I understand that if I lose
                my passphrase and all recovery codes, my evaluation data will be permanently unrecoverable.
              </span>
            </label>

            <Button
              onClick={() => setStep(4)}
              disabled={!acknowledged}
              className="w-full"
            >
              I&apos;ve Saved My Codes
              <ArrowRight size={16} strokeWidth={1.5} className="ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} strokeWidth={1.5} className="text-gray-900" />
              <div>
                <CardTitle className="uppercase tracking-wide font-sans">Encryption Setup Complete</CardTitle>
                <CardDescription className="font-serif">Your evaluation data is now protected</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-4 mt-4">
            <p className="text-[15px] text-gray-700 leading-relaxed font-serif">
              Your organization&apos;s evaluation data is now protected with AES-256-GCM encryption.
              All future evaluation responses will be encrypted before being stored.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-gray-900">
                <p className="text-[12px] text-gray-500 uppercase tracking-widest font-sans">Algorithm</p>
                <p className="text-[14px] font-medium text-gray-900 mt-1 font-mono">AES-256-GCM</p>
              </div>
              <div className="p-3 bg-white border border-gray-900">
                <p className="text-[12px] text-gray-500 uppercase tracking-widest font-sans">Key Derivation</p>
                <p className="text-[14px] font-medium text-gray-900 mt-1 font-mono">scrypt</p>
              </div>
            </div>

            <Button onClick={() => router.push("/overview")} className="w-full">
              Continue Setup
              <ArrowRight size={16} strokeWidth={1.5} className="ml-2" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function getPassphraseStrength(passphrase: string) {
  if (passphrase.length === 0) return { level: 0, label: "", color: "", textColor: "" };

  let score = 0;
  if (passphrase.length >= 12) score++;
  if (passphrase.length >= 16) score++;
  if (/[A-Z]/.test(passphrase) && /[a-z]/.test(passphrase)) score++;
  if (/[0-9]/.test(passphrase) || /[^A-Za-z0-9]/.test(passphrase)) score++;

  if (score <= 1) return { level: 1, label: "Weak", color: "bg-gray-400", textColor: "text-gray-500" };
  if (score === 2) return { level: 2, label: "Fair", color: "bg-gray-500", textColor: "text-gray-600" };
  if (score === 3) return { level: 3, label: "Good", color: "bg-gray-700", textColor: "text-gray-700" };
  return { level: 4, label: "Strong", color: "bg-gray-900", textColor: "text-gray-900" };
}
