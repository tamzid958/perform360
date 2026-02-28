const COMPANIES = [
  "Acme Corp",
  "Globex",
  "Initech",
  "Massive Dynamic",
  "Hooli",
  "Pied Piper",
  "Umbrella Corp",
  "Wayne Enterprises",
] as const;

export function LogosSection() {
  return (
    <section className="bg-white py-14 overflow-hidden border-y border-gray-100">
      <p className="text-[13px] uppercase tracking-wider text-gray-400 font-medium text-center mb-10">
        Trusted by forward-thinking teams
      </p>

      {/* Marquee container */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap">
          {[...COMPANIES, ...COMPANIES].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="text-[20px] font-semibold text-gray-300 mx-10 inline-block select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
