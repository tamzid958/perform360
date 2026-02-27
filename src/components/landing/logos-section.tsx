const COMPANIES = [
  "Acme Corp",
  "Globex",
  "Initech",
  "Massive Dynamic",
  "Hooli",
  "Pied Piper",
] as const;

export function LogosSection() {
  return (
    <section className="bg-[#f5f5f7] py-16">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[13px] uppercase tracking-wider text-gray-400 font-medium text-center">
          Trusted by forward-thinking teams
        </p>

        <div className="flex items-center justify-center gap-12 flex-wrap mt-8">
          {COMPANIES.map((name) => (
            <span
              key={name}
              className="text-[18px] font-semibold text-gray-300"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
