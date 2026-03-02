"use client";

import { useState, useEffect } from "react";
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
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium transition-all duration-300 ${
                isCompleted
                  ? "bg-[#34c759] text-white"
                  : isActive
                    ? "bg-[#0071e3] text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 size={16} strokeWidth={2} />
              ) : (
                stepNum
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 h-[2px] transition-all duration-300 ${
                  isCompleted ? "bg-[#34c759]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
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
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0058b9] mb-3">
          <span className="text-white text-[20px] font-bold">P</span>
        </div>
        <p className="text-[13px] text-gray-500">Performs360</p>
      </div>

      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-50">
                <Shield size={20} strokeWidth={1.5} className="text-brand-500" />
              </div>
              <div>
                <CardTitle>Secure Your Evaluation Data</CardTitle>
                <CardDescription>Set up end-to-end encryption for your organization</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-4 mt-4">
            <p className="text-[15px] text-gray-700 leading-relaxed">
              Performs360 uses end-to-end encryption to protect all evaluation responses.
              You need to set an encryption passphrase that will be used to encrypt and decrypt evaluation data.
            </p>

            <div className="space-y-3">
              <div className="flex gap-3 p-3 rounded-xl bg-gray-50">
                <Lock size={18} strokeWidth={1.5} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-gray-800">Your passphrase is never stored</p>
                  <p className="text-[13px] text-gray-500">Only you know it — we cannot retrieve it for you</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-gray-50">
                <Shield size={18} strokeWidth={1.5} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-gray-800">Even Performs360 staff cannot access your data</p>
                  <p className="text-[13px] text-gray-500">Encryption is enforced cryptographically, not just by permissions</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-amber-50">
                <AlertTriangle size={18} strokeWidth={1.5} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-amber-800">If lost, data is permanently unrecoverable</p>
                  <p className="text-[13px] text-amber-700">You will receive recovery codes as a backup — store them safely</p>
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
              <div className="p-2 rounded-xl bg-brand-50">
                <Key size={20} strokeWidth={1.5} className="text-brand-500" />
              </div>
              <div>
                <CardTitle>Create Your Encryption Passphrase</CardTitle>
                <CardDescription>Choose a strong passphrase you can remember</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-4 mt-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-[13px] text-red-700">{error}</p>
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
                      className={`h-1.5 flex-1 rounded-full transition-all ${
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
              <div className="p-2 rounded-xl bg-amber-50">
                <Shield size={20} strokeWidth={1.5} className="text-amber-500" />
              </div>
              <div>
                <CardTitle>Save Your Recovery Codes</CardTitle>
                <CardDescription>These codes can be used to recover your encryption key if you forget your passphrase</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-4 mt-4">
            <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle size={18} strokeWidth={1.5} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-700 leading-relaxed">
                Each code can only be used once. Store them in a secure location like a password manager.
                This is the only time these codes will be displayed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[14px] text-gray-800 text-center"
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

            <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0071e3] focus:ring-[#0071e3]/20"
              />
              <span className="text-[13px] text-gray-700 leading-relaxed">
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
              <div className="p-2 rounded-xl bg-green-50">
                <CheckCircle2 size={20} strokeWidth={1.5} className="text-green-500" />
              </div>
              <div>
                <CardTitle>Encryption Setup Complete</CardTitle>
                <CardDescription>Your evaluation data is now protected</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-4 mt-4">
            <p className="text-[15px] text-gray-700 leading-relaxed">
              Your organization&apos;s evaluation data is now protected with AES-256-GCM encryption.
              All future evaluation responses will be encrypted before being stored.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-[12px] text-gray-500 uppercase tracking-wider">Algorithm</p>
                <p className="text-[14px] font-medium text-gray-900 mt-1">AES-256-GCM</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-[12px] text-gray-500 uppercase tracking-wider">Key Derivation</p>
                <p className="text-[14px] font-medium text-gray-900 mt-1">scrypt</p>
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

  if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-400", textColor: "text-red-500" };
  if (score === 2) return { level: 2, label: "Fair", color: "bg-amber-400", textColor: "text-amber-500" };
  if (score === 3) return { level: 3, label: "Good", color: "bg-blue-400", textColor: "text-blue-500" };
  return { level: 4, label: "Strong", color: "bg-green-400", textColor: "text-green-500" };
}
