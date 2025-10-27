// ui/src/components/mapsearch/LifestyleToggles.tsx
import React from "react";
import {
  BuildingLibraryIcon, // schools
  ShoppingCartIcon,    // groceries
  SunIcon,             // parks (replacement for TreePineIcon)
  MapPinIcon,          // transit (replacement for BusIcon)
} from "@heroicons/react/24/outline";

export type LifestyleState = {
  schools: boolean;
  groceries: boolean;
  parks: boolean;
  transit: boolean;
};

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function Chip({
  on,
  label,
  Icon,
  toggle,
}: {
  on: boolean;
  label: string;
  Icon: HeroIcon;
  toggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`h-9 rounded-2xl border px-3 text-sm shadow-sm inline-flex items-center gap-2 ${
        on ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white/70"
      }`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

export default function LifestyleToggles({
  value,
  onChange,
}: {
  value: LifestyleState;
  onChange: (next: LifestyleState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip
        on={value.schools}
        label="Top-rated schools"
        Icon={BuildingLibraryIcon}
        toggle={() => onChange({ ...value, schools: !value.schools })}
      />
      <Chip
        on={value.groceries}
        label="Groceries"
        Icon={ShoppingCartIcon}
        toggle={() => onChange({ ...value, groceries: !value.groceries })}
      />
      <Chip
        on={value.parks}
        label="Parks"
        Icon={SunIcon}
        toggle={() => onChange({ ...value, parks: !value.parks })}
      />
      <Chip
        on={value.transit}
        label="Transit"
        Icon={MapPinIcon}
        toggle={() => onChange({ ...value, transit: !value.transit })}
      />
    </div>
  );
}
