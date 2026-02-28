import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
          <span className="text-[40px] font-bold text-gray-300">404</span>
        </div>
        <div>
          <h1 className="text-title text-gray-900">Page Not Found</h1>
          <p className="text-body text-gray-500 mt-2">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-[#0071e3] hover:bg-[#0058b9] text-white rounded-full px-6 py-2.5 text-[15px] font-medium transition-all duration-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
