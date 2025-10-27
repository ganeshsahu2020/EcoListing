import React from "react";

export default function SkipLink({ target = "#result-list" }: { target?: string }) {
  return (
    <a
      href={target}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-white border rounded px-3 py-2 shadow z-[9999]"
    >
      Skip to results
    </a>
  );
}
