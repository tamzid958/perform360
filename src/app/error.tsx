"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <span className="text-white text-[16px] font-bold leading-none">P</span>
        </div>
        <span className="text-headline text-gray-900">Performs360</span>
      </Link>

      <div className="w-full max-w-[420px] text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <AlertCircle size={36} strokeWidth={1.5} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-title text-gray-900">Something Went Wrong</h1>
          <p className="text-body text-gray-500 mt-2">
            An unexpected error occurred. Please try again.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="secondary" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
