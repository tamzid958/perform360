export function BuiltBy() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center py-1.5 bg-white/80 backdrop-blur-sm border-t border-gray-100">
      <p className="text-[11px] text-gray-400 tracking-wide">
        Built by{" "}
        <a
          href="https://github.com/tamzid958/perform360"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
        >
          Tamzid Ahmed
        </a>
      </p>
    </div>
  );
}
