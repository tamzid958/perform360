import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-[#1d1d1f] text-white py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-[15px] font-bold text-white">P</span>
            </div>
            <span className="text-headline text-white">Performs360</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-[14px] text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/security-policy"
              className="text-[14px] text-gray-400 hover:text-white transition-colors"
            >
              Security Policy
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <p className="text-[13px] text-gray-500 text-center">
            &copy; 2026 Performs360. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
