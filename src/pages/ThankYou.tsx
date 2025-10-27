import React from "react";

export default function ThankYou() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-4xl font-extrabold text-emerald-700 mb-3">Thank You for Your Request! 🎉</h1>
      <p className="text-lg text-slate-700 mb-6">
        We’ve received your tour request and are excited to help you explore your next eco-friendly home.
      </p>
      <div className="mx-auto max-w-md">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-6 py-5 mb-5">
          <p className="text-slate-700">
            <span className="font-medium text-emerald-900">What happens next?</span><br />
            Our team will review your request and reach out by email within 24 hours to confirm your tour time and answer any questions you may have. 
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
  );
}