import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link href="/" className="mb-10">
        <Image src="/logo.png" alt="Performs360" width={140} height={26} className="h-7 w-auto" />
      </Link>

      <div className="w-full max-w-[420px] text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
          <span className="text-[40px] font-bold text-gray-300">404</span>
        </div>
        <div>
          <h1 className="text-title text-gray-900">Page Not Found</h1>
          <p className="text-body text-gray-500 mt-2">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/guide">View Guide</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
