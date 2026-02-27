import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
          <Mail size={28} strokeWidth={1.5} className="text-brand-500" />
        </div>
        <h1 className="text-title text-gray-900">Check your email</h1>
        <p className="text-body text-gray-500 mt-2">
          We sent you a sign-in link
        </p>
      </div>

      <Card padding="lg">
        <div className="text-center space-y-3">
          <p className="text-body text-gray-600">
            Click the link in the email to sign in to your account. The link will expire in 24 hours.
          </p>
          <p className="text-callout text-gray-400">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
        </div>
      </Card>
    </div>
  );
}
