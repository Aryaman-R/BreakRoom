"use client";

import { useId } from "react";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function GuestSlider({ value, onChange, min = 5, max = 60 }: Props) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm text-ah-cream/85 mb-3">
        <span>Guest count</span>
        <span className="font-display text-ah-electric text-2xl">
          {value}
          <span className="text-ah-cream/60 text-base ml-1">people</span>
        </span>
      </label>
      <div className="relative">
        <div className="h-2 rounded-full bg-ah-cream/15 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${pct}%`,
              backgroundImage:
                "linear-gradient(90deg, #ff4d9e, #ff9f45, #d7f25a, #6EE7B7, #A78BFA)",
            }}
          />
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
        <div
          className="absolute -top-1 h-4 w-4 rounded-full bg-ah-electric shadow border-2 border-ah-bg pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
          aria-hidden
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-mono text-ah-cream/50">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}
