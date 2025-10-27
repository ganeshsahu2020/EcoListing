import React from "react";
import { Link } from "react-router-dom";
import {
  DocumentChartBarIcon,
  BookmarkSquareIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

/** Pro Brand icon with graceful fallback */
function BrandIcon({ size = 32 }: { size?: number }) {
  const candidates = ["/ecolisting-icon.svg", "/ecolisting-wordmark-dark.svg", "/logo.svg"];
  const [idx, setIdx] = React.useState(0);
  return (
    <img
      src={candidates[idx]}
      alt="Eco Listing"
      height={size}
      width={size}
      className="h-8 w-8 rounded-lg shadow-lg bg-white/10"
      onError={() => setIdx((i) => (i < candidates.length - 1 ? i + 1 : i))}
      loading="lazy"
    />
  );
}

/** Pro brand mark: gradient Eco + Listing */
function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <BrandIcon size={32} />
      <span className="text-xl font-semibold leading-none tracking-tight select-none">
        <span className="text-gradient bg-gradient-to-r from-emerald-400 via-blue-500 to-emerald-600 bg-clip-text text-transparent">
          Eco
        </span>
        <span className="text-slate-900">Listing</span>
      </span>
    </span>
  );
}

/* App Store and Trust Badges (optional, update src/links as needed) */
const APP_BADGES = [
  {
    src: "/appstore.svg",
    alt: "Download on the App Store",
    href: "#",
  },
  {
    src: "/googleplay.svg",
    alt: "Get it on Google Play",
    href: "#",
  },
];
const TRUST_BADGES = [
  { src: "/badge-secure.svg", alt: "Secure Payment" },
  { src: "/badge-partner.svg", alt: "Official Partner" },
];

export default function FooterCTA() {
  return (
    <footer className="bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 pt-10 pb-2">
      <div className="mx-auto max-w-7xl px-4">
        {/* Glassmorphism CTAs */}
        <div className="rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-2xl p-6 sm:p-10 mb-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <FooterCTAItem
              to="/report"
              icon={<DocumentChartBarIcon className="h-6 w-6 text-emerald-500 group-hover:text-blue-600 transition-colors" />}
              title="Get Detailed Report"
              subtitle="Pricing, comps & trends"
              gradient="from-blue-400/30 to-emerald-400/30"
            />
            <FooterCTAItem
              to="/search?save=1"
              icon={<BookmarkSquareIcon className="h-6 w-6 text-emerald-500 group-hover:text-blue-600 transition-colors" />}
              title="Save Search"
              subtitle="Email alerts for matches"
              gradient="from-emerald-400/30 to-blue-400/30"
            />
            <FooterCTAItem
              to="/auth/login?signup=1&next=/agent/profile"
              icon={<UserPlusIcon className="h-6 w-6 text-emerald-500 group-hover:text-blue-600 transition-colors" />}
              title="Agent Signup"
              subtitle="Join the EcoListing network"
              gradient="from-blue-400/30 to-emerald-400/30"
            />
          </div>
        </div>

        {/* Brand, Tagline, App Badges, Trust Badges, Nav */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-6">
          <div className="flex flex-col gap-2">
            <BrandMark />
            <p className="text-sm text-slate-600">
              EcoListing — A Smarter Way to Buy and Sell Homes
            </p>
            {/* App Badges (show only if available) */}
            <div className="flex gap-2 mt-2">
              {APP_BADGES.map(badge => (
                <a key={badge.alt} href={badge.href} target="_blank" rel="noopener noreferrer">
                  <img src={badge.src} alt={badge.alt} className="h-8 w-auto rounded shadow bg-white/90" loading="lazy" />
                </a>
              ))}
            </div>
            {/* Trust Badges */}
            <div className="flex gap-2 mt-2">
              {TRUST_BADGES.map(badge => (
                <img key={badge.alt} src={badge.src} alt={badge.alt} className="h-7 w-auto rounded bg-white/80 shadow p-1" loading="lazy" />
              ))}
            </div>
          </div>
          {/* Nav */}
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-base font-medium">
            <FooterNavLink to="/faq">FAQ</FooterNavLink>
            <FooterNavLink to="/about">About</FooterNavLink>
            <FooterNavLink to="/contact">Contact</FooterNavLink>
            <FooterNavLink to="/privacy">Privacy Policy</FooterNavLink>
          </nav>
        </div>

        {/* Legal line (no repeated links) */}
        <div className="mt-2 border-t border-slate-200 pt-4 text-xs text-slate-500 text-center">
          &copy; {new Date().getFullYear()} EcoListing. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterCTAItem({
  to,
  icon,
  title,
  subtitle,
  gradient,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-gradient-to-tr ${gradient} px-5 py-4 shadow-lg hover:border-emerald-400 hover:bg-white/90 transition-all`}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 group-hover:bg-blue-400/10 transition-all">
        {icon}
      </span>
      <div>
        <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
          {title}
        </div>
        <div className="text-sm text-slate-500">{subtitle}</div>
      </div>
    </Link>
  );
}

function FooterNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-slate-600 hover:text-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/40 rounded"
    >
      {children}
    </Link>
  );
}