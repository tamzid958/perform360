import { Check, Lock, Key, Shield, ChevronDown } from "lucide-react";

const bulletItems = [
  "AES-256-GCM encryption at rest",
  "Company-owned encryption keys via Argon2id",
  "Zero-access architecture — platform operators excluded",
  "Export your company data on demand in readable format",
  "No vendor lock-in — your data stays portable",
  "No backdoors, no escrow, no exceptions",
];

export function SecuritySection() {
  return (
    <section id="security" className="bg-[#fafafa] py-16 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
          {/* Left column — text */}
          <div className="h-full">
            <span className="inline-flex items-center rounded-full bg-[#eff6ff] text-[#0071e3] text-[13px] font-medium px-4 py-1.5 border border-[#0071e3]/10">
              Security
            </span>

            <h2 className="text-display-small text-gray-900 mt-6">
              Your data, your keys.
              <br />
              Even we can&apos;t read it.
            </h2>

            <p className="text-body text-gray-500 mt-6 leading-relaxed">
              Performs360 uses envelope encryption with company-owned keys.
              Evaluation responses are encrypted at rest using AES-256-GCM, and
              only your organization&apos;s administrators can decrypt the data.
            </p>

            <ul className="mt-8 space-y-4">
              {bulletItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#34c759]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check
                      size={14}
                      strokeWidth={2}
                      className="text-[#34c759]"
                    />
                  </span>
                  <span className="text-body text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — key hierarchy diagram */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 h-full flex flex-col justify-center">
            {/* Card 1 — Company Passphrase */}
            <div className="bg-gradient-to-r from-[#eff6ff] to-white rounded-xl p-5 border border-[#0071e3]/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0071e3] flex items-center justify-center">
                  <Lock size={20} strokeWidth={1.5} className="text-white" />
                </div>
                <div>
                  <p className="text-headline text-gray-900">
                    Company Passphrase
                  </p>
                  <p className="text-caption-style">Set by your admin</p>
                </div>
              </div>
            </div>

            {/* Connector */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-[#0071e3]/30 to-[#0071e3]/10" />
              <ChevronDown size={16} strokeWidth={1.5} className="text-[#0071e3]/40 -mt-1" />
            </div>

            {/* Card 2 — Master Key */}
            <div className="bg-gradient-to-r from-[#f0fdf4] to-white rounded-xl p-5 border border-[#34c759]/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#34c759] flex items-center justify-center">
                  <Key size={20} strokeWidth={1.5} className="text-white" />
                </div>
                <div>
                  <p className="text-headline text-gray-900">Master Key</p>
                  <p className="text-caption-style">Derived via Argon2id</p>
                </div>
              </div>
            </div>

            {/* Connector */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-[#34c759]/30 to-[#af52de]/10" />
              <ChevronDown size={16} strokeWidth={1.5} className="text-[#af52de]/40 -mt-1" />
            </div>

            {/* Card 3 — Encrypted Responses */}
            <div className="bg-gradient-to-r from-[#faf5ff] to-white rounded-xl p-5 border border-[#af52de]/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#af52de] flex items-center justify-center">
                  <Shield size={20} strokeWidth={1.5} className="text-white" />
                </div>
                <div>
                  <p className="text-headline text-gray-900">
                    Encrypted Responses
                  </p>
                  <p className="text-caption-style">AES-256-GCM protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
