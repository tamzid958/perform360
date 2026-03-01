import Link from "next/link";
import { Mail, ArrowLeft, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Mobile-only logo */}
      <div className="flex items-center justify-center gap-3 lg:hidden">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <span className="text-white text-[18px] font-bold">P</span>
        </div>
        <span className="text-[20px] font-semibold tracking-tight text-gray-900">
          Performs360
        </span>
      </div>

      <div>
        <h1 className="text-title text-gray-900">Check your email</h1>
        <p className="text-body text-gray-500 mt-2">
          We sent you a secure sign-in link
        </p>
      </div>

      <Card padding="lg" className="animate-fade-in-up delay-100">
        <div className="flex flex-col items-center text-center space-y-5">
          {/* Animated mail icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
              <Mail
                size={28}
                strokeWidth={1.5}
                className="text-brand-500"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#34c759] flex items-center justify-center ring-4 ring-white">
              <Inbox size={10} strokeWidth={2.5} className="text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-body text-gray-700">
              Click the link in your email to sign in.
            </p>
            <p className="text-callout text-gray-400">
              The link expires in 24 hours. Check your spam folder if you
              don&apos;t see it.
            </p>
          </div>

          <div className="w-full pt-2">
            <Button variant="secondary" className="w-full gap-2" asChild>
              <Link href="/login">
                <ArrowLeft size={16} strokeWidth={1.5} />
                Back to sign in
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
