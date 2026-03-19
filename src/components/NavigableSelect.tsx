"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Option = {
  value: string;
  label: string;
};

export default function NavigableSelect({
  paramName,
  options,
  value,
  className = "",
}: {
  paramName: string;
  options: Option[];
  value: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className={`rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--glass-border)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)] transition-colors ${className}`}
      style={{ fontFamily: "var(--font-titillium)" }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
