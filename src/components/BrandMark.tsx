import React from "react";

export const BrandMark: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 120 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="EcoListing"
    role="img"
  >
    <defs>
      <linearGradient id="eco-gradient" x1="0" y1="0" x2="120" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#16a34a" />
        <stop offset="1" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="16" r="14" fill="url(#eco-gradient)" />
    <rect x="40" y="8" width="70" height="16" rx="8" fill="#fff" opacity="0.9" />
    <text x="50" y="22" fontFamily="Segoe UI, Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#164e63">
      EcoListing
    </text>
  </svg>
);