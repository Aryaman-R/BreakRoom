"use client";

const PHOTOS = [
  { color: "#FF3D8A", swatch: "#FFE066" },
  { color: "#FF8C42", swatch: "#A78BFA" },
  { color: "#A78BFA", swatch: "#6EE7B7" },
  { color: "#6EE7B7", swatch: "#FF3D8A" },
  { color: "#FFE066", swatch: "#FF8C42" },
];

export function TheSpace() {
  return (
    <section className="py-24">
      <div className="container-page">
        <div className="flex items-baseline justify-between gap-6 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-ah-electric">The space</p>
            <h2 className="mt-3 font-party text-4xl sm:text-5xl text-ah-cream tracking-tightish">
              See what you&#8217;re working with.
            </h2>
          </div>
          <p className="text-ah-cream/80 max-w-md font-mono text-sm">
            Up to 40 standing &middot; 24 seated &middot; A/V included &middot; Catering options
          </p>
        </div>

        <div
          className="mt-10 -mx-6 px-6 overflow-x-auto snap-x snap-mandatory flex gap-5 pb-4"
          style={{ scrollbarWidth: "thin" }}
        >
          {PHOTOS.map((p, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-[78%] sm:w-[420px] aspect-[4/5] rounded-3xl overflow-hidden shadow-lifted"
              style={{ border: `4px solid ${p.color}` }}
            >
              <SpacePhoto color={p.color} swatch={p.swatch} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpacePhoto({
  color,
  swatch,
  index,
}: {
  color: string;
  swatch: string;
  index: number;
}) {
  return (
    <svg viewBox="0 0 400 500" className="w-full h-full block" aria-hidden>
      <defs>
        <linearGradient id={`bg-${index}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2B1450" />
          <stop offset="100%" stopColor="#1A0F2E" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#bg-${index})`} />
      {/* String lights */}
      <g stroke={swatch} strokeWidth="2" fill={swatch}>
        {Array.from({ length: 10 }).map((_, i) => {
          const x = 20 + i * 42;
          const y = 50 + Math.sin(i * 0.7) * 14;
          return <circle key={i} cx={x} cy={y} r="5" />;
        })}
      </g>
      {/* Confetti */}
      {Array.from({ length: 26 }).map((_, i) => (
        <rect
          key={i}
          x={(i * 73 + index * 19) % 380 + 10}
          y={120 + ((i * 37) % 320)}
          width="6"
          height="14"
          transform={`rotate(${i * 31} ${(i * 73 + index * 19) % 380 + 13} ${120 + ((i * 37) % 320) + 7})`}
          fill={i % 2 ? color : swatch}
          opacity="0.9"
        />
      ))}
      {/* Crowd silhouettes */}
      <g fill="#1A0F2E" opacity="0.85">
        <circle cx="80"  cy="380" r="22" />
        <circle cx="140" cy="380" r="22" />
        <circle cx="200" cy="380" r="22" />
        <circle cx="260" cy="380" r="22" />
        <circle cx="320" cy="380" r="22" />
        <rect x="40"  y="400" width="320" height="120" />
      </g>
      <g fill={color} opacity="0.7">
        <ellipse cx="200" cy="260" rx="140" ry="60" />
      </g>
    </svg>
  );
}
