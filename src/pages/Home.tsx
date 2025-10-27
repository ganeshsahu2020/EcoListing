// src/pages/Home.tsx
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  HomeModernIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ChartBarSquareIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import HowItWorks from "../components/HowItWorks";

/* ─────────────────────────────────────────────────────────
   Small Presentational Cards
   ──────────────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md px-6 py-8 flex flex-col items-center text-center gap-3 hover:shadow-lg transition-shadow">
      <div className="bg-emerald-50 rounded-full p-3 mb-1">
        <Icon className="h-7 w-7 text-emerald-500" />
      </div>
      <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
      <p className="text-slate-600 text-sm">{desc}</p>
    </div>
  );
}

function TestimonialCard({
  name,
  quote,
  avatar,
}: {
  name: string;
  quote: string;
  avatar: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-3 items-start max-w-sm mx-auto">
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300"
        />
        <span className="font-semibold text-slate-900">{name}</span>
      </div>
      <blockquote className="italic text-slate-700 text-base">&ldquo;{quote}&rdquo;</blockquote>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Types for Chat Panel (role union fix)
   ──────────────────────────────────────────────────────── */
type ChatRole = "assistant" | "user";
type ChatMsg = {
  who: string;
  content: string;
  role: ChatRole;
  created_at: string;
  id: string;
};

const HERO_VIDEOS = ["/videos/hero1.mp4", "/videos/hero2.mp4", "/videos/hero3.mp4", "/videos/hero4.mp4"];

/* ─────────────────────────────────────────────────────────
   Chat Panel & FAB (aligned with other files)
   ──────────────────────────────────────────────────────── */
function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const supportAvatars = ["/avatars/support1.png", "/avatars/support2.png", "/avatars/support3.png", "/avatars/bot.png"];

  // ✅ Type-safe messages state
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      who: "Repliers",
      content: "Hello! How can I assist you today with your real estate needs?",
      role: "assistant",
      created_at: new Date().toISOString(),
      id: "init",
    },
  ]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, sending, open]);

  function send(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setMessages((msgs) => [
      ...msgs,
      {
        who: "You",
        content: text,
        role: "user",
        created_at: new Date().toISOString(),
        id: Math.random().toString(36).slice(2),
      },
    ]);
    setText("");
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        {
          who: "Repliers",
          content: "Thank you for reaching out! We'll get back to you soon.",
          role: "assistant",
          created_at: new Date().toISOString(),
          id: Math.random().toString(36).slice(2),
        },
      ]);
      setSending(false);
    }, 900);
  }

  if (!open) return null;
  return (
    <main
      className="fixed z-50 w-full bottom-0 left-0 right-0 flex items-end justify-center md:justify-end px-2 pb-2 md:pb-8 md:pr-8 transition-all"
      style={{ pointerEvents: "none" }}
    >
      <section
        className="w-full max-w-lg bg-white/90 rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col pointer-events-auto transition-all md:rounded-r-[2.5rem]"
        style={{ minHeight: "420px", maxHeight: "90vh" }}
      >
        {/* Close Button */}
        <button
          aria-label="Close chat panel"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/60 hover:bg-slate-200 shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
          style={{ pointerEvents: "auto" }}
          onClick={onClose}
        >
          <XMarkIcon className="h-6 w-6 text-slate-700" />
        </button>

        {/* Header */}
        <div className="relative flex flex-col items-center justify-center bg-gradient-to-r from-indigo-700 via-blue-700 to-emerald-600 px-6 py-6">
          <div className="flex items-center gap-8 mb-2">
            <span className="flex flex-col items-center">
              <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7 text-white/80" />
              <span className="text-xs text-white/80 pt-1 font-semibold">Chat</span>
            </span>
          </div>
          <div className="flex items-center -space-x-4 mb-2">
            {supportAvatars.map((src, i) => (
              <img
                key={src}
                src={src}
                className="w-11 h-11 rounded-full border-4 border-white ring-2 ring-indigo-400 bg-white object-cover shadow-lg transition-all"
                style={{ zIndex: supportAvatars.length - i }}
                alt="Support"
              />
            ))}
          </div>
          <div className="text-white font-semibold text-lg flex items-center gap-2">Questions? Chat with us!</div>
          <div className="flex items-center gap-2 text-green-200 text-xs mt-1">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" /> Support is online
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-col flex-1 bg-white/80 min-h-[250px]">
          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={[
                  "flex items-end",
                  m.role === "user" ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                {m.role !== "user" && (
                  <div className="mr-2 flex-shrink-0">
                    <span className="inline-block w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
                    </span>
                  </div>
                )}
                <div
                  className={[
                    "max-w-[80vw] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-elev-1",
                    m.role === "user"
                      ? "bg-gradient-to-r from-emerald-50 to-blue-50 text-slate-900 rounded-br-none"
                      : "bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-bl-none",
                  ].join(" ")}
                  title={new Date(m.created_at).toLocaleString()}
                >
                  <div className="text-xs mb-1 opacity-80">{m.who}</div>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
                {m.role === "user" && (
                  <div className="ml-2 flex-shrink-0">
                    <span className="inline-block w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
                    </span>
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-end justify-start">
                <div className="mr-2">
                  <span className="inline-block w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="max-w-[75%] px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 shadow-elev-1 rounded-bl-none animate-pulse">
                  Repliers is typing…
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form className="flex items-center gap-2 border-t border-slate-200 bg-white/90 px-3 py-3" onSubmit={send}>
            <input
              className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 text-base transition"
              placeholder="Compose your message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
            />
            <button
              className="flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-blue-600 text-white px-4 py-2 font-bold shadow hover:scale-105 focus:scale-105 transition-all h-11"
              disabled={sending || !text.trim()}
              type="submit"
              aria-label="Send"
            >
              <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
            </button>
          </form>
        </div>
      </section>

      <style>{`
        @media (min-width: 768px) {
          main { justify-content: flex-end !important; }
        }
        @media (max-width: 640px) {
          section { border-radius: 1.2rem !important; padding-bottom: env(safe-area-inset-bottom, 0) !important; }
        }
      `}</style>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────
   Home Page
   ──────────────────────────────────────────────────────── */
export default function Home() {
  // Video playlist logic
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Chat panel state for footer chat
  const [chatOpen, setChatOpen] = useState(false);

  // When a video ends, go to the next, or loop to the start
  const handleEnded = () => {
    setCurrent((prev) => (prev + 1) % HERO_VIDEOS.length);
  };

  // If the video file changes, reload and play
  React.useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.load();
      // play() can be blocked by autoplay policy; ignore errors
      v.play().catch(() => {});
    }
  }, [current]);

  return (
    // Pull the page up under the sticky header (chromeless-at-top)
    <main className="bg-[#F6F9F9] overflow-x-hidden" style={{ marginTop: "calc(var(--app-header-h, 0px) * -1)" }}>
      {/* HERO */}
      <section
        className="relative bg-[#171717] text-white min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{ paddingTop: "var(--app-header-h, 0px)" }}
      >
        {/* Video background with playlist support */}
        <video
          ref={videoRef}
          autoPlay
          loop={false}
          muted
          playsInline
          onEnded={handleEnded}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          poster="/images/hero.jpg"
        >
          <source src={HERO_VIDEOS[current]} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/80 mb-6">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-300" />
            <span className="uppercase text-xs tracking-widest font-semibold text-emerald-100">
              Eco-Friendly, Smart, Trusted
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Find Your Greener Home
            </span>
          </h1>
          <p className="text-lg md:text-2xl font-light mb-8 text-white/80">
            Discover homes with <span className="font-semibold text-emerald-300">eco-certification</span> and
            next-gen smart features—search, compare, and move in with confidence.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/search"
              className="bg-[#1ABC9C] hover:bg-emerald-700 transition-colors px-8 py-3 rounded-lg font-semibold shadow text-lg"
            >
              Start Searching <ArrowRightIcon className="inline w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/about"
              className="border border-white/40 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* SMART SEARCH BAR */}
      <section className="container mx-auto -mt-10 md:-mt-12 flex justify-center px-3 z-10 relative">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 flex gap-3">
          <input
            className="h-12 flex-1 rounded-lg border border-slate-200 px-4 outline-none focus:border-emerald-500 bg-slate-50"
            placeholder="Search by city, neighborhood, MLS#…"
          />
          <Link
            to="/listings"
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center transition"
          >
            Search
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* FEATURES */}
      <section className="py-16 px-3 container mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-slate-900">
          Why Choose <span className="text-emerald-600">EcoListing</span>?
        </h2>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <FeatureCard
            icon={HomeModernIcon}
            title="AI-Powered Home Match"
            desc="Smart recommendations for your lifestyle, budget, and eco goals."
          />
          <FeatureCard
            icon={MapPinIcon}
            title="Neighborhood Insights"
            desc="School ratings, walkability, and local eco amenities at a glance."
          />
          <FeatureCard
            icon={ChartBarSquareIcon}
            title="Eco-Score Analytics"
            desc="See energy ratings and sustainability scores for every property."
          />
        </div>
      </section>

      {/* PROPERTY SHOWCASE */}
      <section className="bg-white py-16 px-3">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-900 text-center">
            Featured <span className="text-emerald-600">Listings</span>
          </h2>
        </div>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl shadow hover:shadow-lg transition overflow-hidden bg-slate-100">
              <img
                src={`/images/listing${i}.jpg`}
                alt={`Featured Listing ${i}`}
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Beautiful Eco Home #{i}</h3>
                <p className="text-slate-600 text-sm mb-3">3 bed · 2 bath · Solar panels · Smart thermostat</p>
                <Link to="/listings" className="text-emerald-600 hover:underline font-medium text-sm">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT / STORY */}
      <section className="py-20 bg-[#F6F9F9] px-3">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12 max-w-6xl">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
            <p className="text-base md:text-lg text-slate-700 mb-6">
              EcoListing was founded to simplify the journey to a more sustainable home—making it easy to discover,
              compare, and buy properties that are better for your family and the planet.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-slate-800 font-medium">Verified eco-certification on all listings</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-slate-800 font-medium">Trusted agents and transparent data</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-slate-800 font-medium">Modern tools to save you time and money</span>
              </li>
            </ul>
          </div>
          <div className="flex-1">
            <img
              src="/images/about-story.jpg"
              alt="EcoListing team or sustainable neighborhood"
              className="w-full h-64 md:h-80 rounded-xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-[#171717] px-3">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-12 text-center">What Our Users Say</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <TestimonialCard
              name="Priya & Daniel"
              quote="EcoListing helped us find an energy-efficient home that lowered our bills. Seamless search and friendly experts!"
              avatar="/images/avatar1.jpg"
            />
            <TestimonialCard
              name="Morgan L."
              quote="The map filters made it super fast to narrow down options. Loved the eco-score details!"
              avatar="/images/avatar2.jpg"
            />
            <TestimonialCard
              name="Sara J."
              quote="I never thought buying a home could be this smooth. The listings felt curated just for me."
              avatar="/images/avatar3.jpg"
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 px-3 bg-gradient-to-r from-emerald-500 to-cyan-500">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to make your move?</h2>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Start your journey to a smarter, greener home today.
          </p>
          <Link
            to="/listings"
            className="bg-white text-emerald-700 px-10 py-4 rounded-lg font-semibold text-lg shadow hover:bg-slate-50 transition"
          >
            Browse Listings
          </Link>
        </div>
      </section>

      {/* Chat FAB in footer */}
      {!chatOpen && (
        <button
          aria-label="Open chat"
          type="button"
          className="fixed z-50 bottom-6 right-6 md:bottom-10 md:right-10 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-lg rounded-full w-16 h-16 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-emerald-200 hover:scale-110 transition-all"
          style={{ pointerEvents: "auto" }}
          onClick={() => setChatOpen(true)}
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8" />
        </button>
      )}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Animations for chat panel/fab */}
      <style>{`
        @keyframes wiggle { 0%,100% { transform: rotate(-7deg);} 50% { transform: rotate(7deg);} }
        .animate-wiggle { animation: wiggle 1s infinite alternate; }
      `}</style>
    </main>
  );
}
