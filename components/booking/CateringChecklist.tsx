"use client";

const OPTIONS = [
  { id: "coffee_bar", label: "Coffee bar" },
  { id: "light_bites", label: "Light bites" },
  { id: "full_menu",   label: "Full menu" },
  { id: "space_only",  label: "Just the space" },
] as const;

type Catering = (typeof OPTIONS)[number]["id"];

interface Props {
  value: Catering[];
  onChange: (v: Catering[]) => void;
  error?: string;
}

export function CateringChecklist({ value, onChange, error }: Props) {
  const toggle = (id: Catering) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div>
      <label className="block text-sm text-ah-cream/85 mb-2">Catering</label>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const checked = value.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              aria-pressed={checked}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                checked
                  ? "bg-ah-mint text-ah-bg border-ah-mint"
                  : "border-ah-cream/25 text-ah-cream/85 hover:text-ah-cream"
              }`}
            >
              {checked ? "✓ " : ""}{opt.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p
          className="mt-1.5 text-xs text-ah-magenta"
          role="alert"
          dangerouslySetInnerHTML={{ __html: error }}
        />
      )}
    </div>
  );
}
