import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Security Policy — Performs360",
};

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="h-16 border-b border-gray-100 flex items-center px-6">
        <div className="max-w-3xl mx-auto w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[14px] text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back to Performs360
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-title-large text-gray-900">Security Policy</h1>
        <p className="text-caption-style mt-2">Last updated: February 28, 2026</p>

        <div className="mt-10 space-y-8 text-body text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-title-small text-gray-900 mb-3">1. Overview</h2>
            <p>
              Security is foundational to Performs360. Our platform handles sensitive performance evaluation data,
              and we have built our architecture around the principle of zero-trust and zero-access. This document
              outlines the technical and organizational measures we implement to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">2. Encryption Architecture</h2>
            <p className="mb-3">
              Performs360 uses a multi-layered envelope encryption scheme:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-gray-900">Encryption at rest:</strong> All evaluation responses are encrypted
                using AES-256-GCM before being written to the database.
              </li>
              <li>
                <strong className="text-gray-900">Company-owned keys:</strong> Each company&apos;s data key is derived from
                an encryption passphrase set by the company administrator. The passphrase is processed through Argon2id
                to produce a master key, which encrypts the AES-256 data key.
              </li>
              <li>
                <strong className="text-gray-900">Zero-access design:</strong> The platform operator (Performs360 team,
                including super admins) cannot decrypt evaluation data. The encryption passphrase is never transmitted to
                or stored on our servers in plaintext.
              </li>
              <li>
                <strong className="text-gray-900">Encryption in transit:</strong> All network communication uses TLS 1.3.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">3. Authentication & Access Control</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-gray-900">Passwordless authentication:</strong> Company users authenticate via
                magic links (email-based, powered by NextAuth.js). No passwords are stored.
              </li>
              <li>
                <strong className="text-gray-900">OTP verification for evaluations:</strong> External reviewers authenticate
                via 6-digit OTP codes sent to their registered email. OTPs are bcrypt-hashed, expire after 10 minutes,
                and lock out after 3 failed attempts (15-minute cooldown).
              </li>
              <li>
                <strong className="text-gray-900">Role-based access control (RBAC):</strong> Four roles (Admin, HR, Manager, Member)
                with strict permission boundaries. Only Admin and HR can view decrypted evaluation reports.
              </li>
              <li>
                <strong className="text-gray-900">Multi-tenant isolation:</strong> Every database query is scoped to the
                authenticated user&apos;s company. Cross-tenant data access is architecturally impossible.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">4. Key Management</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Company encryption passphrases are known only to the company administrator.</li>
              <li>Recovery codes are generated during setup, shown once, and stored as bcrypt hashes.</li>
              <li>Key rotation is supported — administrators can rotate data keys from the settings panel.</li>
              <li>
                If both the passphrase and all recovery codes are lost, data is <strong className="text-gray-900">permanently
                unrecoverable</strong>. This is by design — it guarantees no backdoor exists.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">5. Infrastructure Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Hosted on Vercel with automatic DDoS protection and edge network distribution</li>
              <li>PostgreSQL database hosted on Supabase/Neon with encrypted connections and automated backups</li>
              <li>Environment variables and secrets managed securely — never committed to source control</li>
              <li>CSRF protection via SameSite cookies and NextAuth.js built-in protections</li>
              <li>Input validation on all API endpoints using Zod schemas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">6. Rate Limiting</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>OTP sends: Maximum 5 per email per hour</li>
              <li>OTP verification: Maximum 3 attempts per session (15-minute cooldown after)</li>
              <li>API calls: 100 requests per minute per IP address</li>
              <li>Authentication attempts are logged and monitored for anomalies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">7. Audit Logging</h2>
            <p>
              All sensitive operations are logged with timestamps, user identifiers, and action types. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Decryption events (who viewed which evaluation data, when)</li>
              <li>Role changes and user management actions</li>
              <li>Encryption key rotation events</li>
              <li>Super admin impersonation sessions (target company, duration, actions taken)</li>
            </ul>
            <p className="mt-3">
              Audit logs are visible to company administrators only and cannot be modified or deleted.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">8. Incident Response</h2>
            <p>
              In the event of a security incident, we will notify affected companies within 72 hours with details of
              the incident, data impacted (if any), and remediation steps. Due to our zero-access encryption architecture,
              a breach of our infrastructure does not expose evaluation response content.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">9. Responsible Disclosure</h2>
            <p>
              If you discover a security vulnerability, please report it to{" "}
              <strong className="text-gray-900">security@performs360.com</strong>. We appreciate responsible disclosure
              and will work with you to address any legitimate findings promptly.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
