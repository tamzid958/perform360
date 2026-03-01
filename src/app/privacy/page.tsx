import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Performs360",
};

export default function PrivacyPolicyPage() {
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
        <h1 className="text-title-large text-gray-900">Privacy Policy</h1>
        <p className="text-caption-style mt-2">Last updated: February 28, 2026</p>

        <div className="mt-10 space-y-8 text-body text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-title-small text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Performs360 (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a 360-degree performance evaluation platform.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our service. We are committed to protecting the privacy and security of your data.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-gray-900">Account information:</strong> Name, email address, company name, and role when you register or are invited to the platform.
              </li>
              <li>
                <strong className="text-gray-900">Evaluation data:</strong> Responses submitted through evaluation forms. This data is end-to-end encrypted with your company&apos;s encryption key — we cannot read it.
              </li>
              <li>
                <strong className="text-gray-900">Usage data:</strong> Log data, device information, and analytics to improve the service (no evaluation content is included).
              </li>
              <li>
                <strong className="text-gray-900">Communication data:</strong> Emails sent through the platform (invitation links, OTP codes, reminders).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain the Performs360 service</li>
              <li>To authenticate users via magic links and OTP verification</li>
              <li>To send evaluation invitations, reminders, and system notifications</li>
              <li>To generate aggregated, anonymized analytics for platform improvement</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">4. Data Encryption & Access</h2>
            <p>
              All evaluation responses are encrypted at rest using AES-256-GCM with company-owned encryption keys.
              The Performs360 platform operator (including super admins) has <strong className="text-gray-900">zero access</strong> to
              decrypted evaluation data. Only your company&apos;s authorized administrators can decrypt and view evaluation responses.
            </p>
            <p className="mt-3">
              If your company&apos;s encryption passphrase and recovery codes are lost, the evaluation data is permanently
              unrecoverable. There is no backdoor, escrow, or platform-level recovery mechanism by design.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">5. Data Sharing</h2>
            <p>We do not sell, rent, or trade your personal information. We may share data only in these circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>With infrastructure providers (hosting, email delivery) who process data on our behalf under strict agreements</li>
              <li>When required by law, regulation, or valid legal process</li>
              <li>To protect the rights, safety, or property of Performs360, our users, or the public</li>
            </ul>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">6. Data Retention</h2>
            <p>
              Account data is retained while your account is active. Evaluation data is retained according to your
              company administrator&apos;s settings. When a company account is deleted, all associated data — including
              encrypted evaluation responses — is permanently removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Request data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact your company administrator or reach out to us at{" "}
              <strong className="text-gray-900">privacy@performs360.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication (session tokens, OTP session cookies). We do not use
              third-party advertising or tracking cookies. Analytics cookies, if used, are anonymized and do not
              track individual users across sites.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify registered users of material
              changes via email. Your continued use of the service after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">10. Contact</h2>
            <p>
              For questions about this Privacy Policy, contact us at{" "}
              <strong className="text-gray-900">privacy@performs360.com</strong>.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
