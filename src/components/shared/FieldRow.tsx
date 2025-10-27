import React from "react";

type Props = { label: React.ReactNode; value: React.ReactNode; className?: string };

export default function FieldRow({ label, value, className = "" }: Props) {
  const v = (value === null || value === undefined || value === "") ? "—" : value;
  return (
    <div className={`flex items-start justify-between gap-6 border-b border-slate-200 py-2 ${className}`}>
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold text-slate-800 text-right">{v as any}</div>
    </div>
  );
}
