"use client";

import { motion } from "framer-motion";
import { Check, Lock, Key, Shield, ChevronDown } from "lucide-react";

const bulletItems = [
  "AES-256-GCM encryption at rest",
  "Company-owned encryption keys via Argon2id",
  "Zero-access architecture — platform operators excluded",
  "No backdoors, no escrow, no exceptions",
];

export function SecuritySection() {
  return (
    <section id="security" className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column — text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="text-[13px] uppercase tracking-wider text-[#0071e3] font-medium">
              Security
            </span>

            <h2 className="text-display-small text-gray-900 mt-4">
              Your data, your keys.
              <br />
              Even we can&apos;t read it.
            </h2>

            <p className="text-body text-gray-500 mt-6 leading-relaxed">
              Perform360 uses envelope encryption with company-owned keys.
              Evaluation responses are encrypted at rest using AES-256-GCM, and
              only your organization&apos;s administrators can decrypt the data.
            </p>

            <ul className="mt-8 space-y-4">
              {bulletItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#eff6ff] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check
                      size={14}
                      strokeWidth={1.5}
                      className="text-[#0071e3]"
                    />
                  </span>
                  <span className="text-body text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right column — key hierarchy diagram */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="bg-[#f5f5f7] rounded-2xl p-8">
              {/* Card 1 — Company Passphrase */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                    <Lock
                      size={20}
                      strokeWidth={1.5}
                      className="text-[#0071e3]"
                    />
                  </div>
                  <div>
                    <p className="text-headline text-gray-900">
                      Company Passphrase
                    </p>
                    <p className="text-caption text-gray-500">
                      Set by your admin
                    </p>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-8 bg-gray-200" />
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  className="text-gray-300 -mt-1"
                />
              </div>

              {/* Card 2 — Master Key */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                    <Key
                      size={20}
                      strokeWidth={1.5}
                      className="text-[#0071e3]"
                    />
                  </div>
                  <div>
                    <p className="text-headline text-gray-900">Master Key</p>
                    <p className="text-caption text-gray-500">
                      Derived via Argon2id
                    </p>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-8 bg-gray-200" />
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  className="text-gray-300 -mt-1"
                />
              </div>

              {/* Card 3 — Encrypted Responses */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                    <Shield
                      size={20}
                      strokeWidth={1.5}
                      className="text-[#0071e3]"
                    />
                  </div>
                  <div>
                    <p className="text-headline text-gray-900">
                      Encrypted Responses
                    </p>
                    <p className="text-caption text-gray-500">
                      AES-256-GCM protected
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
