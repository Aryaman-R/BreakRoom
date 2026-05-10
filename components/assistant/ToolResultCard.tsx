"use client";

/**
 * Renders the structured output of a Beans tool call as a small inline card.
 * Each tool gets its own component so adding a new tool doesn't bloat the
 * rest. Unknown tools fall back to a JSON dump.
 */

interface Props {
  name: string;
  result: unknown;
}

export function ToolResultCard({ name, result }: Props) {
  switch (name) {
    case "get_specials":
      return <SpecialsCard result={result as Special[]} />;
    case "get_menu":
      return <MenuCard result={result as MenuCat[]} />;
    case "get_hours":
      return <HoursCard result={result as Record<string, string>} />;
    case "get_directions":
      return <DirectionsCard result={result as { address: string; mapUrl: string }} />;
    case "check_availability":
      return <AvailabilityCard result={result as { date: string; slots: { time: string; available: boolean }[] }} />;
    default:
      return (
        <pre className="mt-2 text-[11px] bg-qh-bg-elevated border border-qh-line rounded p-2 overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      );
  }
}

interface Special { id: string; name: string; price: number; description: string }
interface MenuCat { id: string; name: string; items: { id: string; name: string; price: number }[] }

function SpecialsCard({ result }: { result: Special[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {result.map((s) => (
        <li key={s.id} className="flex items-baseline gap-2">
          <span className="font-display text-sm">{s.name}</span>
          <span className="dotted-leader" />
          <span className="font-mono text-xs">${s.price.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}

function MenuCard({ result }: { result: MenuCat[] }) {
  return (
    <div className="mt-2 space-y-3">
      {result.map((cat) => (
        <div key={cat.id}>
          <p className="font-display italic text-sm text-qh-accent">{cat.name}</p>
          <ul className="mt-1 space-y-1">
            {cat.items.map((i) => (
              <li key={i.id} className="flex items-baseline gap-2 text-xs">
                <span>{i.name}</span>
                <span className="dotted-leader" />
                <span className="font-mono">${i.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function HoursCard({ result }: { result: Record<string, string> }) {
  const days = [
    ["Mon", "mon"], ["Tue", "tue"], ["Wed", "wed"], ["Thu", "thu"],
    ["Fri", "fri"], ["Sat", "sat"], ["Sun", "sun"],
  ];
  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      {days.map(([label, key]) => (
        <li key={key} className="flex justify-between gap-2">
          <span className="text-qh-ink-soft">{label}</span>
          <span className="font-mono">{result[key]}</span>
        </li>
      ))}
    </ul>
  );
}

function DirectionsCard({ result }: { result: { address: string; mapUrl: string } }) {
  return (
    <div className="mt-2 text-xs">
      <p className="font-mono">{result.address}</p>
      <a
        href={result.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-1 text-qh-accent underline underline-offset-2"
      >
        Open in map ↗
      </a>
    </div>
  );
}

function AvailabilityCard({
  result,
}: {
  result: { date: string; slots: { time: string; available: boolean }[] };
}) {
  return (
    <div className="mt-2">
      <p className="text-xs text-qh-ink-soft">For {result.date}:</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {result.slots.map((s) => (
          <span
            key={s.time}
            className={
              s.available
                ? "px-2 py-0.5 rounded-full border border-qh-accent text-qh-accent text-[11px] font-mono"
                : "px-2 py-0.5 rounded-full border border-qh-line text-qh-ink-soft line-through text-[11px] font-mono"
            }
          >
            {s.time}
          </span>
        ))}
      </div>
    </div>
  );
}
