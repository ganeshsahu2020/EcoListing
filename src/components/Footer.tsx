import React, { useState } from "react";
import { Link } from "react-router-dom";

/* Brand icon with fallback */
function BrandIcon({ size = 32 }: { size?: number }) {
  const candidates = ["/ecolisting-icon.svg", "/ecolisting-wordmark-light.svg", "/logo.svg"];
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={candidates[idx]}
      alt="Eco Listing"
      height={size}
      width={size}
      className="h-8 w-8 rounded-lg shadow-lg bg-white/10"
      onError={() => setIdx((i) => (i < candidates.length - 1 ? i + 1 : i))}
    />
  );
}
function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <BrandIcon size={32} />
      <span className="text-2xl font-semibold leading-none tracking-tight select-none">
        <span className="text-gradient bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-600 bg-clip-text text-transparent">
          Eco
        </span>
        <span className="text-white">Listing</span>
      </span>
    </span>
  );
}

/* Social Icons w/ Animation */
function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="rounded-lg p-2 text-white/90 hover:text-emerald-400 hover:bg-emerald-600/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 group"
    >
      <span className="block group-hover:scale-110 transition-transform">{children}</span>
    </a>
  );
}
function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" fill="none" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M13.5 21v-7h2.3l.4-3h-2.7V9c0-.9.3-1.5 1.7-1.5H16V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.2-3.7 3.8V11H7v3h3v7h3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconLinkedIn(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M6.94 8.5H4V20h2.94V8.5ZM5.47 3.75A1.75 1.75 0 1 0 5.47 7a1.75 1.75 0 0 0 0-3.25Z" fill="currentColor" />
      <path d="M20 20h-2.94v-5.9c0-1.53-.55-2.58-1.93-2.58-1.05 0-1.68.72-1.96 1.42-.1.24-.12.58-.12.92V20H10.1s.04-9.8 0-10.8h2.95v1.53c.39-.6 1.1-1.46 2.67-1.46 1.95 0 3.28 1.28 3.28 4.04V20Z" fill="currentColor" />
    </svg>
  );
}

/* Quick Links Section */
const QUICK_LINKS = [
  {
    heading: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Press", to: "/press" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Contact", to: "/contact" },
      { label: "Help Center", to: "/support" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
    ],
  },
  {
    heading: "Discover",
    links: [
      { label: "Sold Properties", to: "/listings?sold=1" },
      { label: "Enquiry", to: "/contact?reason=enquiry" },
      { label: "Blog", to: "/blog" },
    ],
  },
];

/* Trust Badges Example */
const TRUST_BADGES = [
  { src: "/badge-checkmark.svg", alt: "Verified" },
  { src: "/badge-shield.svg", alt: "Protected" },
  { src: "/badge-star.svg", alt: "Top Rated" },
  { src: "/badge-lock.svg", alt: "SSL Secure" },
];

export default function Footer() {
  const [newsletterSent, setNewsletterSent] = useState(false);
  function onNewsletter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNewsletterSent(true);
    setTimeout(() => setNewsletterSent(false), 4000);
  }

  return (
    <footer className="relative bg-gradient-to-br from-[#071a1f] via-[#0c2631] to-[#143a4d] text-slate-200 pt-10">
      {/* Card/Glass section */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl bg-white/5 backdrop-blur-md shadow-2xl border border-white/10 p-8 md:p-12 grid md:grid-cols-4 gap-10">
          {/* Brand & Blurb */}
          <div className="col-span-1 flex flex-col gap-3">
            <BrandMark />
            <p className="mt-2 text-sm text-slate-300">
              EcoListing — A Smarter Way to Buy and Sell Homes.
            </p>
            <p className="text-xs text-slate-400/90 max-w-xs">
              Low commission sales, advanced technology, and personalized support for a seamless property-selling experience.
            </p>
            {/* Trust Badges */}
            <div className="mt-4 flex gap-2 flex-wrap">
              {TRUST_BADGES.map((badge, i) => (
                <img
                  key={i}
                  src={badge.src}
                  alt={badge.alt}
                  className="h-7 w-auto rounded shadow bg-white/80 p-1"
                  loading="lazy"
                />
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 flex flex-col gap-4">
            <h3 className="text-sm font-bold tracking-[0.13em] text-white/90 uppercase">Stay Updated</h3>
            <form onSubmit={onNewsletter} className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="footer-newsletter" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter"
                type="email"
                required
                placeholder="Enter your email"
                className="h-11 w-full flex-1 rounded-xl border border-white/20 bg-white/15 px-4 text-white placeholder:text-white/50 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20"
                disabled={newsletterSent}
              />
              <button
                type="submit"
                className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 font-semibold text-white shadow-lg hover:from-blue-700 hover:to-emerald-600 transition focus:outline-none focus:ring-4 focus:ring-blue-400/30"
                disabled={newsletterSent}
              >
                {newsletterSent ? "Subscribed!" : "Subscribe"}
              </button>
            </form>
            <span className="text-xs text-slate-400 mt-1">
              We respect your privacy. Unsubscribe at any time.
            </span>
          </div>

          {/* App & Social */}
          <div className="col-span-1 flex flex-col gap-3 items-end">
            {/* App Badges */}
            <FooterAppBadges />
            <h3 className="text-sm font-bold tracking-[0.13em] text-white/90 uppercase mt-3">Follow Us</h3>
            <div className="flex items-center gap-3 mt-1">
              <SocialIcon href="https://instagram.com/" label="Instagram">
                <IconInstagram className="h-6 w-6" />
              </SocialIcon>
              <SocialIcon href="https://facebook.com/" label="Facebook">
                <IconFacebook className="h-6 w-6" />
              </SocialIcon>
              <SocialIcon href="https://linkedin.com/" label="LinkedIn">
                <IconLinkedIn className="h-6 w-6" />
              </SocialIcon>
            </div>
            {/* Contact Info */}
            <div className="mt-4 text-xs text-right">
              <div>
                <a href="mailto:hello@ecolisting.com" className="hover:underline text-emerald-300">hello@ecolisting.com</a>
              </div>
              <div>
                <a href="tel:+1234567890" className="hover:underline text-emerald-300">+1 (234) 567-890</a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-dashed border-white/20" />

        {/* Footer Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {QUICK_LINKS.map((section, i) => (
            <div key={i}>
              <h4 className="text-base font-semibold text-white/95 mb-2">{section.heading}</h4>
              <ul className="space-y-2 text-sm">
                {section.links.map(link => (
                  <li key={link.to}>
                    <FooterLink to={link.to}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Language/Theme Switcher Example */}
        <div className="flex items-center gap-4 justify-between pb-6">
          {/* Language Selector: (Replace with your logic) */}
          <div className="flex gap-2 items-center text-xs">
            <span className="text-slate-400">Language:</span>
            <button className="px-2 rounded hover:bg-emerald-600/20">EN</button>
            <button className="px-2 rounded hover:bg-emerald-600/20">ES</button>
          </div>
          {/* Theme toggle placeholder */}
          <button
            className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-400/10 text-xs font-semibold"
            // onClick={toggleTheme}
          >
            <span className="inline-block w-4 h-4 bg-gradient-to-tr from-yellow-300 to-emerald-400 rounded-full mr-1"></span>
            Toggle Theme
          </button>
        </div>

        {/* Bottom Legal Line */}
        <div className="mt-2 border-t border-white/10 pt-6 text-xs text-slate-400 text-center">
          &copy; {new Date().getFullYear()} EcoListing. All rights reserved. | Designed with <span className="text-emerald-400">♥</span>
        </div>
      </div>
    </footer>
  );
}

// The visually aligned app badges component.
function FooterAppBadges() {
  return (
    <div className="flex items-center gap-4">
      <a
        href="https://apps.apple.com/app/idYOUR_APP_ID"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="/appstore.svg"
          alt="Download on the App Store"
          className="block"
          style={{
            height: 30,
            minWidth: 110,
            maxWidth: 200,
            objectFit: "contain",
            borderRadius: 12,
            background: "#111", // To match Google badge bg if wanted
          }}
        />
      </a>
      <a
        href="https://play.google.com/store/apps/details?id=YOUR_APP_ID"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="/googleplay.png"
          alt="Get it on Google Play"
          className="block"
          style={{
            height: 40,
            minWidth: 80,
            maxWidth: 120,
            objectFit: "contain",
            borderRadius: 12,
            background: "#111",
            padding: "4px 0",
            boxSizing: "border-box",
          }}
        />
      </a>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center text-slate-300 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 rounded transition-colors"
    >
      {children}
    </Link>
  );
}