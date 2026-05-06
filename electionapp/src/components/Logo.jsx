export function Logo({ size = 'md' }) {
  const scale = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;
  const textClass =
    size === 'sm' ? 'text-base font-bold' :
    size === 'lg' ? 'text-3xl font-bold' :
    'text-xl font-bold';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width={scale}
        height={scale}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {/* Rounded card background */}
        <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#logo-grad)" />
        {/* Top decorative line (ballot header) */}
        <rect x="9" y="9" width="14" height="2.5" rx="1.25" fill="white" fillOpacity="0.35" />
        {/* Checkmark */}
        <path
          d="M10 18 L14.5 22.5 L22.5 13"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`${textClass} text-white tracking-tight`}>
        Vote<span className="text-blue-400">Sure</span>
      </span>
    </div>
  );
}
