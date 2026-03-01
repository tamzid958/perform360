"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Mail, CheckCircle2, Send, ArrowRight } from "lucide-react";

export default function SetupResendPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [from, setFrom] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    async function checkExisting() {
      const res = await fetch("/api/company");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data.settings?.resend?.apiKey) {
          router.replace("/overview");
        }
      }
    }
    checkExisting();
  }, [router]);

  const canTest = apiKey.trim().length > 0;
  const canSave = canTest;

  async function handleTest() {
    setTesting(true);
    setTestSuccess(false);
    try {
      const res = await fetch("/api/company/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, from }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Test failed");
      setTestSuccess(true);
      addToast(`Test email sent to ${json.data.sentTo}`, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Email test failed", "error");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { resend: { apiKey, from } } }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      addToast("Email settings saved", "success");
      router.push("/overview");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save email settings", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0058b9] mb-3">
          <span className="text-white text-[20px] font-bold">P</span>
        </div>
        <p className="text-[13px] text-gray-500">Performs360</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50">
              <Mail size={20} strokeWidth={1.5} className="text-brand-500" />
            </div>
            <div>
              <CardTitle>Set Up Email Sending</CardTitle>
              <CardDescription>
                Connect your Resend account so your organization can send evaluation invitations, reminders, and notifications. Only an API key is required — domain verification is optional.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-4 mt-4">
          <div className="flex gap-3 p-3 rounded-xl bg-gray-50">
            <Mail size={18} strokeWidth={1.5} className="text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-medium text-gray-800">Why is this needed?</p>
              <p className="text-[13px] text-gray-500">
                Performs360 sends evaluation invitations and OTP codes via email.
                Each organization uses its own Resend API key to send these emails. You can optionally verify a domain to send from your own address.
              </p>
            </div>
          </div>

          <Input
            id="resend-api-key"
            label="Resend API Key"
            type="password"
            placeholder="re_xxxxxxxxxxxx"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setTestSuccess(false); }}
          />

          <Input
            id="resend-from"
            label="From Address (optional)"
            placeholder="Company Name <noreply@yourdomain.com>"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setTestSuccess(false); }}
          />

          <p className="text-[12px] text-gray-400">
            Get your API key at resend.com/api-keys. Optionally verify your domain in Resend to send from your own address. If left blank, the system default address is used.
          </p>

          {testSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle2 size={16} strokeWidth={1.5} className="text-green-500" />
              <p className="text-[13px] text-green-700">Test email sent successfully — your configuration is working.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleTest}
              disabled={!canTest || testing}
            >
              <Send size={16} strokeWidth={1.5} className="mr-2" />
              {testing ? "Sending..." : "Send Test Email"}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex-1"
            >
              {saving ? "Saving..." : "Save & Continue"}
              {!saving && <ArrowRight size={16} strokeWidth={1.5} className="ml-2" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
