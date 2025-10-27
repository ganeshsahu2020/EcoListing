// ui/src/pages/static/Contact.tsx
import React, { useState } from "react";
import { supabase } from "../../utils/supabaseClient"; // Adjust to match your actual path

export default function Contact() {
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportTopics = [
    "General Inquiry",
    "Technical Support",
    "Partnerships",
    "Media & Press",
    "Career Opportunities",
    "Feedback",
  ];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const topic = formData.get("topic")?.toString() || "";
    const subject = formData.get("subject")?.toString() || "";
    const message = formData.get("message")?.toString() || "";

    try {
      // Preferred: route through lead-intake (unified lead/notification pipeline)
      let ok = false;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-intake`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              event: "contact_form",
              name,
              email,
              topic,
              subject,
              message,
              address: null,
              property_id: null,
              visitor_id: localStorage.getItem("guest_chat_visitor_id") || null,
              meta: { page: window.location.pathname },
            }),
          }
        );
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          ok = !!json?.ok;
        }
      } catch {
        // swallow — we'll try fallback insert next
      }

      // Fallback: direct DB insert so we never lose a submission
      if (!ok) {
        const { error: dbErr } = await supabase
          .from("contact_messages")
          .insert([{ name, email, topic, subject, message }]);
        if (dbErr) throw dbErr;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError("Sorry, we couldn’t send your message. Please try again or email us directly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Contact EcoListing</h1>
      <p className="text-slate-600 text-lg mb-8">
        We value your feedback and are here to help with any questions. Choose a topic or reach us directly—our team is committed to responding within 1–2 business days.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg transition hover:shadow-2xl">
        {submitted ? (
          <div className="mx-auto max-w-2xl px-4 py-24 text-center">
            <h1 className="text-4xl font-extrabold text-emerald-700 mb-3">Thank You for Your Message! 🎉</h1>
            <p className="text-lg text-slate-700 mb-6">
              We’ve received your message and are excited to help you with your inquiry.
            </p>
            <div className="mx-auto max-w-md">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-6 py-5 mb-5">
                <p className="text-slate-700">
                  <span className="font-medium text-emerald-900">What happens next?</span><br />
                  Our team will review your message and reach out by email within 24 hours.
                </p>
              </div>
              <div className="text-slate-500 mb-6">
                In the meantime, feel free to browse more <a href="/listings" className="text-emerald-700 underline hover:text-emerald-900">eco-friendly listings</a> or read our <a href="/faq" className="text-emerald-700 underline hover:text-emerald-900">FAQ</a>.
              </div>
              <div className="text-sm text-slate-400">
                Need urgent assistance? Contact us anytime at <a href="mailto:support@ecolisting.com" className="text-emerald-700 underline">support@ecolisting.com</a>.
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1" htmlFor="name">
                  Name <span className="text-emerald-600">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  placeholder="Your Name"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1" htmlFor="email">
                  Email <span className="text-emerald-600">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  placeholder="you@email.com"
                  type="email"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1" htmlFor="topic">
                Support Topic <span className="text-emerald-600">*</span>
              </label>
              <select
                id="topic"
                name="topic"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                required
                defaultValue=""
              >
                <option value="" disabled>Select a topic</option>
                {supportTopics.map((topic, idx) => (
                  <option key={idx} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1" htmlFor="subject">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                placeholder="Subject (optional)"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1" htmlFor="message">
                Message <span className="text-emerald-600">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500 transition"
                placeholder="How can we help you?"
                required
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-slate-500">
                Prefer email? <a href="mailto:support@ecolisting.com" className="text-emerald-700 underline">support@ecolisting.com</a><br />
                For press: <a href="mailto:press@ecolisting.com" className="text-emerald-700 underline">press@ecolisting.com</a>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-60"
                disabled={busy}
              >
                {busy ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending…
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
            {error && (
              <div className="text-red-600 mt-3 text-sm">{error}</div>
            )}
          </form>
        )}
      </div>

      {/* Contact & Social Section */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-6 border border-slate-100 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Office & Hours</h3>
          <p className="text-slate-600 mb-4">
            EcoListing HQ<br />
            123 Green Avenue<br />
            San Francisco, CA 94123<br />
            <span className="block mt-2">Mon – Fri: 9:00 AM – 5:00 PM PT</span>
          </p>
          <div className="mt-auto">
            <h4 className="font-semibold text-slate-800 mb-1">Connect With Us</h4>
            <div className="flex gap-3">
              <a href="https://facebook.com/ecolisting" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg className="h-6 w-6 text-emerald-700 hover:text-emerald-900 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07c0 5.01 3.66 9.13 8.44 9.93v-7.03H7.9V12.1h2.54v-1.56c0-2.5 1.5-3.89 3.8-3.89 1.1 0 2.24.2 2.24.2v2.48h-1.26c-1.24 0-1.63.77-1.63 1.56v1.21h2.78l-.44 2.88h-2.34v7.03C18.34 21.2 22 17.08 22 12.07z"/></svg>
              </a>
              <a href="https://twitter.com/ecolisting" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <svg className="h-6 w-6 text-emerald-700 hover:text-emerald-900 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.23 4.23 0 001.84-2.33 8.42 8.42 0 01-2.7 1.03 4.21 4.21 0 00-7.2 3.84A11.94 11.94 0 013 4.79a4.22 4.22 0 001.3 5.62c-.7-.02-1.36-.21-1.93-.53v.05a4.22 4.22 0 003.38 4.13c-.31.08-.65.13-.99.13-.24 0-.47-.02-.7-.07a4.22 4.22 0 003.95 2.94A8.48 8.48 0 012 19.54a11.94 11.94 0 006.29 1.84c7.55 0 11.68-6.25 11.68-11.67 0-.18 0-.35-.01-.53A8.18 8.18 0 0024 4.59a8.36 8.36 0 01-2.54.7z"/></svg>
              </a>
              <a href="https://linkedin.com/company/ecolisting" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <svg className="h-6 w-6 text-emerald-700 hover:text-emerald-900 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11.47 19h-3v-9h3v9zm-1.5-10.29c-.97 0-1.75-.8-1.75-1.75s.78-1.75 1.75-1.75 1.75.8 1.75 1.75-.78 1.75-1.75 1.75zm13.47 10.29h-3v-4.5c0-1.08-.02-2.47-1.51-2.47-1.51 0-1.74 1.18-1.74 2.39v4.58h-3v-9h2.88v1.23h.04c.4-.75 1.37-1.54 2.82-1.54 3.01 0 3.57 1.98 3.57 4.56v4.75z"/></svg>
              </a>
              <a href="https://instagram.com/ecolisting" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg className="h-6 w-6 text-emerald-700 hover:text-emerald-900 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.584.012 4.849.07 1.366.061 2.633.329 3.608 1.304.974.974 1.243 2.242 1.304 3.608.058 1.265.069 1.649.069 4.849s-.012 3.584-.07 4.849c-.061 1.366-.329 2.633-1.304 3.608-.974.974-2.242 1.243-3.608 1.304-1.265.058-1.649.07-4.849.07s-3.584-.012-4.849-.07c-1.366-.061-2.633-.329-3.608-1.304-.974-.974-1.243-2.242-1.304-3.608-.058-1.265-.07-1.649-.07-4.849s.012-3.584.07-4.849c.61-1.366.329-2.633 1.304-3.608.974-.974 2.242-1.243 3.608-1.304 1.265-.058 1.649-.07 4.849-.07zm0-2.16c-3.259 0-3.667.013-4.947.072-1.277.059-2.682.328-3.64 1.286-.958.958-1.227 2.363-1.286 3.64-.059 1.28-.072 1.688-.072 4.947s.013 3.667.072 4.947c.059 1.277.328 2.682 1.286 3.64.958.958 2.363 1.227 3.64 1.286 1.28.059 1.688.072 4.947.072s3.667-.013 4.947-.072c1.277-.059 2.682-.328 3.64-1.286.958-.958 1.227-2.363 1.286-3.64.059-1.28.072-1.688.072-4.947s-.013-3.667-.072-4.947c-.059-1.277-.328-2.682-1.286-3.64-.958-.958-2.363-1.227-3.64-1.286-1.28-.059-1.688-.072-4.947-.072zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-7.998 3.999 3.999 0 010 7.998zm6.406-11.845a1.44 1.44 0 11-2.879 0 1.44 1.44 0 012.879 0z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Visit Us</h3>
          <div className="rounded-lg overflow-hidden border border-slate-200">
            <iframe
              title="EcoListing HQ Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-122.42305755615234%2C37.77253732095703%2C-122.3954200744629%2C37.78754714972712&amp;layer=mapnik"
              width="100%"
              height="180"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            ></iframe>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            <a href="https://www.openstreetmap.org/?mlat=37.78&amp;mlon=-122.41#map=15/37.78/-122.41" target="_blank" rel="noopener noreferrer" className="underline">
              View Larger Map
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
