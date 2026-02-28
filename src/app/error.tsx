"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
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
        <button
          onClick={reset}
          className="inline-flex items-center justify-center bg-[#0071e3] hover:bg-[#0058b9] text-white rounded-full px-6 py-2.5 text-[15px] font-medium transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
