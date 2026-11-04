"use client";

import { useRouter } from "next/navigation";

type SortSelectProps = {
  value: string;
  options: { value: string; label: string; href: string }[];
};

/** Sort control for server-rendered listings: each option carries the URL that applies it. */
export function SortSelect({ value, options }: SortSelectProps) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2.5 text-label font-normal uppercase tracking-[0.2em]">
      Sort
      <select
        value={value}
        onChange={(e) => {
          const next = options.find((o) => o.value === e.target.value);
          if (next) router.push(next.href, { scroll: false });
        }}
        className="cursor-pointer border border-line-strong bg-white px-3.5 py-2.5 text-sm tracking-normal normal-case"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
