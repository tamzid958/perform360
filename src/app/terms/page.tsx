import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description:
    "Performs360 Terms of Service. Read our terms governing the use of the Performs360 360-degree performance review platform.",
};

export default function TermsOfServicePage() {
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
        <h1 className="text-title-large text-gray-900">Terms of Service</h1>
        <p className="text-caption-style mt-2">
          Last updated: March 3, 2026
        </p>

        <div className="mt-10 space-y-8 text-body text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Performs360 (&quot;the Service&quot;), operated by
              Performs360 (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), you agree to be bound by
              these Terms of Service (&quot;Terms&quot;). If you do not agree to these
              Terms, do not use the Service.
            </p>
            <p className="mt-3">
              These Terms apply to all users of the Service, including
              administrators, team members, and external reviewers who access the
              Service via evaluation links.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              2. Description of Service
            </h2>
            <p>
              Performs360 is a 360-degree performance evaluation platform that
              enables organizations to run multi-rater feedback cycles. The
              Service includes evaluation cycle management, team structure
              management, custom evaluation templates, encrypted data storage,
              and performance reporting.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              3. Account Registration
            </h2>
            <p>
              To use the Service, you must register an account by providing your
              company name, your name, and a valid work email address. You are
              responsible for maintaining the confidentiality of your account
              access and for all activities that occur under your account.
            </p>
            <p className="mt-3">
              You agree to provide accurate, current, and complete information
              during registration and to update such information to keep it
              accurate.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              4. Free Service
            </h2>
            <p>
              Performs360 is currently offered free of charge. We reserve the
              right to introduce paid tiers in the future. Any changes to
              pricing will be communicated to existing users in advance, and the
              core features available at the time of your registration will
              remain accessible.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              5. Data Ownership and Encryption
            </h2>
            <p>
              You retain full ownership of all data you submit to the Service,
              including evaluation responses, team structures, and templates.
              Performs360 does not claim any ownership rights over your content.
            </p>
            <p className="mt-3">
              Evaluation response data is encrypted end-to-end using AES-256-GCM
              with encryption keys derived from your company&apos;s passphrase.
              Performs360 has zero access to decrypted evaluation data. You are
              responsible for safeguarding your encryption passphrase and
              recovery codes. If both are lost, the data is permanently
              unrecoverable.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              6. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Use the Service for any unlawful purpose or to violate any
                applicable laws or regulations
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, other
                accounts, or any systems connected to the Service
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service
              </li>
              <li>
                Upload or transmit any malicious code, viruses, or harmful data
              </li>
              <li>
                Use the Service to harass, abuse, or harm other individuals
              </li>
              <li>
                Reverse engineer, decompile, or disassemble any aspect of the
                Service
              </li>
              <li>
                Use automated systems (bots, scrapers) to access the Service
                without permission
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              7. External Reviewer Access
            </h2>
            <p>
              External reviewers access the Service via unique tokenized links
              and one-time password (OTP) verification. External reviewers do
              not need to create accounts. By submitting an evaluation response,
              external reviewers agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              8. Data Export and Portability
            </h2>
            <p>
              You may export your company data at any time in a readable format
              through the Service. Upon account deletion, all associated data
              will be permanently removed within 30 days in accordance with our{" "}
              <Link
                href="/privacy"
                className="text-brand-500 hover:text-brand-600 underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              9. Availability and Modifications
            </h2>
            <p>
              We strive to provide continuous access to the Service but do not
              guarantee uninterrupted availability. We may modify, suspend, or
              discontinue any part of the Service at any time with reasonable
              notice. We will provide at least 30 days&apos; notice before
              discontinuing core functionality.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              10. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Performs360 shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, including but not limited to loss of profits,
              data, or business opportunities, arising out of or related to your
              use of the Service.
            </p>
            <p className="mt-3">
              Our total aggregate liability for any claims arising from the
              Service shall not exceed the amount you have paid us in the
              twelve (12) months preceding the claim (which, for the free tier,
              is $0).
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              11. Disclaimer of Warranties
            </h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, whether express or implied, including but
              not limited to warranties of merchantability, fitness for a
              particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              12. Termination
            </h2>
            <p>
              You may terminate your account at any time by contacting us or
              through account settings. We may suspend or terminate your access
              to the Service if you violate these Terms or engage in conduct
              that we determine is harmful to the Service or other users.
            </p>
            <p className="mt-3">
              Upon termination, your right to use the Service ceases
              immediately. You may export your data prior to termination.
              Provisions that by their nature should survive termination
              (including data ownership, limitation of liability, and dispute
              resolution) shall survive.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              13. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. We will notify
              registered users of material changes via email at least 14 days
              before the changes take effect. Your continued use of the Service
              after the effective date constitutes acceptance of the updated
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              14. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              applicable law. Any disputes arising from these Terms or the
              Service shall be resolved through good-faith negotiation before
              pursuing formal legal remedies.
            </p>
          </section>

          <section>
            <h2 className="text-title-small text-gray-900 mb-3">
              15. Contact
            </h2>
            <p>
              For questions about these Terms of Service, contact us at{" "}
              <strong className="text-gray-900">
                support@performs360.com
              </strong>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
