"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

export default function EvaluateOTPPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(true);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-send OTP on mount
  useEffect(() => {
    async function sendOTP() {
      try {
        const res = await fetch(`/api/evaluate/${params.token}/otp/send`, { method: "POST" });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to send verification code");
        }
      } catch {
        setError("Failed to send verification code");
      } finally {
        setIsSending(false);
      }
    }
    sendOTP();
  }, [params.token]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      handleVerify(pasted);
    }
  }

  async function handleVerify(code: string) {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/evaluate/${params.token}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/evaluate/${params.token}/form`);
      } else {
        setError(data.error || "Invalid verification code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        if (data.cooldown) {
          setCooldown(data.cooldown);
          const interval = setInterval(() => {
            setCooldown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setIsSending(true);
    setError("");
    try {
      await fetch(`/api/evaluate/${params.token}/otp/send`, { method: "POST" });
    } catch {
      setError("Failed to resend code");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-6">
            <Shield size={28} strokeWidth={1.5} className="text-brand-500" />
          </div>
          <h1 className="text-title text-gray-900">Verify Your Identity</h1>
          <p className="text-body text-gray-500 mt-2">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <Card padding="lg">
          {isSending ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 size={24} className="text-brand-500 animate-spin" />
              <p className="text-[14px] text-gray-500">Sending verification code...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading || cooldown > 0}
                    className="w-12 h-14 text-center text-[20px] font-semibold rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all disabled:opacity-50"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <p className="text-[13px] text-red-500 text-center">{error}</p>
              )}

              {cooldown > 0 && (
                <p className="text-[13px] text-amber-600 text-center">
                  Too many attempts. Try again in {cooldown}s
                </p>
              )}

              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={isSending}
                  className="text-[14px] text-brand-500 hover:text-brand-600 font-medium transition-colors disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            </div>
          )}
        </Card>

        <p className="text-center text-[12px] text-gray-400">
          This code expires in 10 minutes. Session valid for 2 hours after verification.
        </p>
      </div>
    </div>
  );
}
