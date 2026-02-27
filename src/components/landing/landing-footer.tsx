import Link from "next/link";

const productLinks = [
  { label: "Features", href: "#" },
  { label: "Security", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Changelog", href: "#" },
];

const companyLinks = [
  { label: "About", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "#" },
];

const legalLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Security Policy", href: "#" },
];

export function LandingFooter() {
  return (
    <footer className="bg-[#1d1d1f] text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1 — Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-[15px] font-bold text-white">P</span>
              </div>
              <span className="text-headline text-white">Perform360</span>
            </div>
            <p className="text-callout text-gray-400 mt-3 max-w-[200px]">
              360&deg; performance evaluations, beautifully simple.
            </p>
          </div>

          {/* Column 2 — Product */}
          <div>
            <h3 className="text-[13px] uppercase tracking-wider text-gray-500 font-medium">
              Product
            </h3>
            {productLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-callout text-gray-400 hover:text-white transition-colors block mt-3"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Column 3 — Company */}
          <div>
            <h3 className="text-[13px] uppercase tracking-wider text-gray-500 font-medium">
              Company
            </h3>
            {companyLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-callout text-gray-400 hover:text-white transition-colors block mt-3"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Column 4 — Legal */}
          <div>
            <h3 className="text-[13px] uppercase tracking-wider text-gray-500 font-medium">
              Legal
            </h3>
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-callout text-gray-400 hover:text-white transition-colors block mt-3"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex justify-between items-center">
            <p className="text-[13px] text-gray-500">
              &copy; 2026 Perform360. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
