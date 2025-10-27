import React from "react";

export const GlassCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div
    className={
      "rounded-xl bg-white/40 shadow-lg backdrop-blur border border-white/20 " + className
    }
    {...props}
  >
    {children}
  </div>
);

export const GlassButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = "", ...props }) => (
  <button
    className={
      "rounded-xl px-4 py-2 font-semibold shadow backdrop-blur bg-white/30 hover:bg-white/50 transition " + className
    }
    {...props}
  >
    {children}
  </button>
);