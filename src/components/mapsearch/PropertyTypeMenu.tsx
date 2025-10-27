import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { UIMapFilters, PropertyTypeState } from "./types";
import { SUBTYPE_KEYWORDS } from "./utils";
import {
  Home as LucideHome,
  Building2 as LucideBuilding2,
  Building as LucideBuilding,
  Trees as LucideTrees,
  Square as LucideSquare,
} from "lucide-react";

const groups = {
  Detached: [
    "Bungalow",
    "Bungalow-Raised",
    "1 1/2 Storey",
    "2-Storey",
    "2 1/2 Storey",
    "3-Storey",
    "Backsplit",
    "Sidesplit",
    "Others",
  ],
  "Semi Detached": [
    "Bungalow",
    "Bungalow-Raised",
    "1 1/2 Storey",
    "2-Storey",
    "2 1/2 Storey",
    "3-Storey",
    "Backsplit",
    "Sidesplit",
    "Others",
  ],
  Condo: ["Condo Apartment", "Condo Townhouse", "Loft", "Others"],
  Townhouse: ["1 1/2 Storey", "2-Storey", "2 1/2 Storey", "3-Storey", "Others"],
  Land: [] as string[],
} as const;

export default function PropertyTypeMenu({
  open,
  filters,
  setFilters,
  onApply,
  onClear,
  onClose, // NEW (optional)
}: {
  open: boolean;
  filters: UIMapFilters;
  setFilters: React.Dispatch<React.SetStateAction<UIMapFilters>>;
  onApply: () => void;
  onClear: () => void;
  onClose?: () => void; // NEW (optional)
}) {
  const [expanded, setExpanded] =
    React.useState<Set<keyof PropertyTypeState["categories"]>>(new Set());
  const toggleExpand = (k: keyof PropertyTypeState["categories"]) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const setPTCategory = (
    key: keyof PropertyTypeState["categories"],
    v: boolean
  ) =>
    setFilters((f) => ({
      ...f,
      propertyType: {
        ...f.propertyType,
        categories: { ...f.propertyType.categories, [key]: v },
      },
    }));

  const togglePTSubtype = (label: string) =>
    setFilters((f) => ({
      ...f,
      propertyType: {
        ...f.propertyType,
        subtypes: {
          ...f.propertyType.subtypes,
          [label]: !f.propertyType.subtypes[label],
        },
      },
    }));

  const clearPropertyType = () =>
    setFilters((f) => ({
      ...f,
      propertyType: {
        categories: {
          detached: false,
          semiDetached: false,
          condo: false,
          townhouse: false,
          land: false,
          other: false,
        },
        subtypes: {},
      },
    }));

  const applyAndClose = () => {
    onApply();
    onClose?.();
  };

  const clearAndClose = () => {
    clearPropertyType();
    onClear();
    onClose?.();
  };

  if (!open) return null;

  return (
    <div
      className="absolute left-0 top-[42px] w-[360px] sm:w-[420px] rounded-2xl border bg-white p-4 shadow-2xl z-50 text-sm"
      style={{ maxHeight: "70vh", overflowY: "auto" }}
      role="dialog"
      aria-modal="true"
      aria-label="Property type filters"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[15px] font-semibold text-slate-900">
          Property type
        </div>
        <button
          className="text-xs text-blue-600 underline"
          onClick={clearAndClose}
          aria-label="Reset property type filters"
        >
          Reset
        </button>
      </div>
      <div className="mt-1 h-px bg-slate-200" />

      <SectionRow
        title="Detached"
        icon={<LucideHome className="text-sky-600" />}
        expanded={expanded.has("detached")}
        checked={filters.propertyType.categories.detached}
        onCheck={(v) => setPTCategory("detached", v)}
        onToggle={() => toggleExpand("detached")}
      >
        {groups.Detached.map((s) => (
          <Sub
            key={s}
            label={s}
            checked={!!filters.propertyType.subtypes[s]}
            onToggle={() => togglePTSubtype(s)}
          />
        ))}
      </SectionRow>

      <SectionRow
        title="Semi Detached"
        icon={<LucideHome className="text-amber-600" />}
        expanded={expanded.has("semiDetached")}
        checked={filters.propertyType.categories.semiDetached}
        onCheck={(v) => setPTCategory("semiDetached", v)}
        onToggle={() => toggleExpand("semiDetached")}
      >
        {groups["Semi Detached"].map((s) => (
          <Sub
            key={s}
            label={s}
            checked={!!filters.propertyType.subtypes[s]}
            onToggle={() => togglePTSubtype(s)}
          />
        ))}
      </SectionRow>

      <SectionRow
        title="Condo"
        icon={<LucideBuilding2 className="text-indigo-600" />}
        expanded={expanded.has("condo")}
        checked={filters.propertyType.categories.condo}
        onCheck={(v) => setPTCategory("condo", v)}
        onToggle={() => toggleExpand("condo")}
      >
        {groups.Condo.map((s) => (
          <Sub
            key={s}
            label={s}
            checked={!!filters.propertyType.subtypes[s]}
            onToggle={() => togglePTSubtype(s)}
          />
        ))}
      </SectionRow>

      <SectionRow
        title="Townhouse"
        icon={<LucideBuilding className="text-blue-600" />}
        expanded={expanded.has("townhouse")}
        checked={filters.propertyType.categories.townhouse}
        onCheck={(v) => setPTCategory("townhouse", v)}
        onToggle={() => toggleExpand("townhouse")}
      >
        {groups.Townhouse.map((s) => (
          <Sub
            key={s}
            label={s}
            checked={!!filters.propertyType.subtypes[s]}
            onToggle={() => togglePTSubtype(s)}
          />
        ))}
      </SectionRow>

      <SectionRow
        title="Land"
        icon={<LucideTrees className="text-green-600" />}
        expanded={expanded.has("land")}
        checked={filters.propertyType.categories.land}
        onCheck={(v) => setPTCategory("land", v)}
        onToggle={() => toggleExpand("land")}
      />

      <SectionRow
        title="Other"
        icon={<LucideSquare className="text-slate-500" />}
        expanded={expanded.has("other")}
        checked={filters.propertyType.categories.other}
        onCheck={(v) => setPTCategory("other", v)}
        onToggle={() => toggleExpand("other")}
      />

      <div className="mt-2 flex justify-between gap-2">
        <button className="px-3 py-1 rounded-lg border" onClick={clearAndClose}>
          Clear
        </button>
        <button
          className="px-3 py-1 rounded-lg bg-emerald-600 text-white"
          onClick={applyAndClose}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function SectionRow({
  title,
  icon,
  expanded,
  checked,
  onCheck,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          aria-label={`Toggle ${title}`}
        />
        <div className="flex items-center gap-2 flex-1">
          <div className="w-5 h-5">{icon}</div>
          <div className="font-semibold text-slate-800">{title}</div>
        </div>
        <button
          className="p-1 rounded hover:bg-slate-50"
          onClick={onToggle}
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
      {expanded && children && <div className="mt-2 ml-8 space-y-2">{children}</div>}
      <div className="mt-2 h-px bg-slate-200" />
    </div>
  );
}

function Sub({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[14px] text-slate-700">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        onChange={onToggle}
        aria-label={label}
      />
      <span>{label}</span>
    </label>
  );
}
