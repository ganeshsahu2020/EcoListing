import React from "react";

/**
 * Injects a11y tweaks: focus rings, reduced-motion defaults, and an optional skip link.
 */
export default function AccessibilityPolish({
  enableSkipLink = true,
  targetId = "main-content",
}: {
  enableSkipLink?: boolean;
  targetId?: string;
}) {
  return (
    <>
      {enableSkipLink && (
        <a
          href={`#${targetId}`}
          className="sr-only focus:not-sr-only fixed top-2 left-2 z-[60] rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          Skip to content
        </a>
      )}
      <style>{`
        :focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(16,185,129,0.45); }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001s !important; animation-iteration-count: 1 !important; transition-duration: 0.001s !important; scroll-behavior: auto !important; }
        }
      `}</style>
    </>
  );
}
