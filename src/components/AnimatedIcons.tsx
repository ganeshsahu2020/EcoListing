import React from "react";
import "./animated-gradient.css";

type IconProps = {
  gradient?: boolean;
  cssFallback?: boolean;
  className?: string;
};

// SMIL animated gradient (for supporting browsers)
const AnimatedGradient = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop>
        <animate
          attributeName="stop-color"
          values="#2563eb;#16a34a;#2563eb"
          dur="3s"
          repeatCount="indefinite"
        />
      </stop>
      <stop offset="1">
        <animate
          attributeName="stop-color"
          values="#16a34a;#2563eb;#16a34a"
          dur="3s"
          repeatCount="indefinite"
        />
      </stop>
    </linearGradient>
  </defs>
);

// Helper for CSS fallback: mask the icon shape over an animated gradient background
function CssGradientMask({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`animated-gradient-bg rounded-full w-8 h-8 flex items-center justify-center ${className ?? ""}`}
      style={{
        WebkitMaskImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">${encodeURIComponent(
          (children as any).props.d || ""
        )}</svg>')`,
        maskImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">${encodeURIComponent(
          (children as any).props.d || ""
        )}</svg>')`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
      aria-hidden="true"
    />
  );
}

export const IconHouse: React.FC<IconProps> = ({
  gradient = true,
  cssFallback = false,
  className = "",
}) =>
  cssFallback ? (
    // CSS fallback: use mask and animated background
    <div className={`w-8 h-8 ${className}`}>
      <div className="animated-gradient-bg w-full h-full rounded-full flex items-center justify-center">
        <svg
          viewBox="0 0 32 32"
          width={32}
          height={32}
          fill="white"
          aria-label="House"
          role="img"
        >
          <polygon points="16,6 28,16 24,16 24,26 8,26 8,16 4,16" />
          <rect x="13" y="20" width="6" height="6" rx="1" />
        </svg>
      </div>
    </div>
  ) : (
    <svg
      className={className}
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="House"
      role="img"
    >
      {gradient && <AnimatedGradient id="house-anim-gradient" />}
      <g>
        <polygon
          points="16,6 28,16 24,16 24,26 8,26 8,16 4,16"
          fill={gradient ? "url(#house-anim-gradient)" : "#2563eb"}
          style={{ transition: "fill 0.5s" }}
        />
        <rect x="13" y="20" width="6" height="6" rx="1" fill="#fff" opacity="0.8" />
      </g>
    </svg>
  );

export const IconCondo: React.FC<IconProps> = ({
  gradient = true,
  cssFallback = false,
  className = "",
}) =>
  cssFallback ? (
    <div className={`w-8 h-8 ${className}`}>
      <div className="animated-gradient-bg w-full h-full rounded-full flex items-center justify-center">
        <svg
          viewBox="0 0 32 32"
          width={32}
          height={32}
          fill="white"
          aria-label="Condo"
          role="img"
        >
          <rect x="8" y="10" width="16" height="16" rx="3" />
          <rect x="12" y="14" width="2" height="2" />
          <rect x="18" y="14" width="2" height="2" />
          <rect x="12" y="18" width="2" height="2" />
          <rect x="18" y="18" width="2" height="2" />
        </svg>
      </div>
    </div>
  ) : (
    <svg
      className={className}
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Condo"
      role="img"
    >
      {gradient && <AnimatedGradient id="condo-anim-gradient" />}
      <g>
        <rect
          x="8"
          y="10"
          width="16"
          height="16"
          rx="3"
          fill={gradient ? "url(#condo-anim-gradient)" : "#16a34a"}
          style={{ transition: "fill 0.5s" }}
        />
        <rect x="12" y="14" width="2" height="2" fill="#fff" opacity="0.8" />
        <rect x="18" y="14" width="2" height="2" fill="#fff" opacity="0.8" />
        <rect x="12" y="18" width="2" height="2" fill="#fff" opacity="0.8" />
        <rect x="18" y="18" width="2" height="2" fill="#fff" opacity="0.8" />
      </g>
    </svg>
  );

export const IconTownhouse: React.FC<IconProps> = ({
  gradient = true,
  cssFallback = false,
  className = "",
}) =>
  cssFallback ? (
    <div className={`w-8 h-8 ${className}`}>
      <div className="animated-gradient-bg w-full h-full rounded-full flex items-center justify-center">
        <svg
          viewBox="0 0 32 32"
          width={32}
          height={32}
          fill="white"
          aria-label="Townhouse"
          role="img"
        >
          <rect x="6" y="14" width="6" height="12" rx="2" />
          <rect x="20" y="14" width="6" height="12" rx="2" />
          <rect x="14" y="10" width="4" height="16" rx="2" />
        </svg>
      </div>
    </div>
  ) : (
    <svg
      className={className}
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Townhouse"
      role="img"
    >
      {gradient && <AnimatedGradient id="townhouse-anim-gradient" />}
      <g>
        <rect
          x="6"
          y="14"
          width="6"
          height="12"
          rx="2"
          fill={gradient ? "url(#townhouse-anim-gradient)" : "#2563eb"}
          style={{ transition: "fill 0.5s" }}
        />
        <rect
          x="20"
          y="14"
          width="6"
          height="12"
          rx="2"
          fill={gradient ? "url(#townhouse-anim-gradient)" : "#16a34a"}
          style={{ transition: "fill 0.5s" }}
        />
        <rect x="14" y="10" width="4" height="16" rx="2" fill="#e0e7ff" />
      </g>
    </svg>
  );