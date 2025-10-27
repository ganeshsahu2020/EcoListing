import React from "react";

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-slate-600 text-lg mb-8">
        At EcoListing, we are committed to protecting your privacy and ensuring transparency about how your information is used. This policy describes how we collect, use, and safeguard your data as part of our real estate services.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. Information We Collect</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>
              <span className="font-medium">Personal Information:</span> Name, email address, phone number, mailing address, and other details you provide when creating an account, submitting inquiries, or signing up for alerts.
            </li>
            <li>
              <span className="font-medium">Property & Preferences:</span> Saved searches, favorite listings, tour requests, communications with agents, and feedback.
            </li>
            <li>
              <span className="font-medium">Usage Data:</span> Device information, IP address, browser type, referral URLs, and how you interact with our website and services.
            </li>
            <li>
              <span className="font-medium">Cookies & Tracking:</span> We use cookies and similar technologies to enhance your experience, remember preferences, and analyze usage patterns.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>Deliver and personalize property recommendations, listing alerts, and communications.</li>
            <li>Facilitate tour bookings, agent communications, and customer support.</li>
            <li>Improve our website, services, and marketing through analytics and user feedback.</li>
            <li>Comply with legal obligations, prevent fraud, and ensure the security of your information.</li>
            <li>With your consent, send promotional emails or updates about new features, services, or listings.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">3. Information Sharing and Disclosure</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>We do <span className="font-medium">not</span> sell your personal information to third parties.</li>
            <li>We may share necessary information with trusted partners (such as real estate agents, service providers, or analytics vendors) solely to deliver and improve our services.</li>
            <li>We may disclose information as required by law or to protect the rights, property, or safety of EcoListing, our users, or others.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Your Choices and Rights</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>Access, update, or delete your account information at any time via your Account settings.</li>
            <li>Manage your email preferences and opt out of marketing communications through your profile or unsubscribe links.</li>
            <li>Request a copy of your data or deletion of your account by contacting our support team.</li>
            <li>Control cookie settings via your browser or our cookie consent options.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Data Security</h2>
          <p className="mt-2 text-slate-600">
            We use industry-standard security measures to protect your data, including encryption, access controls, and regular reviews. However, no system is completely secure; please use strong passwords and safeguard your account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. International Users</h2>
          <p className="mt-2 text-slate-600">
            Our services are based in the United States. If you access EcoListing from outside the U.S., your information may be transferred to, stored, and processed in the U.S. or other locations as necessary.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">7. Policy Updates</h2>
          <p className="mt-2 text-slate-600">
            We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of significant updates and always post the latest version on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">8. Contact Us</h2>
          <p className="mt-2 text-slate-600">
            If you have questions or requests regarding your privacy, please contact our Data Protection Officer at <a href="mailto:privacy@ecolisting.com" className="text-emerald-700 underline">privacy@ecolisting.com</a>.
          </p>
        </section>
      </div>

      <p className="mt-10 text-xs text-slate-500 italic">
        This Privacy Policy is provided as a general template for real estate organizations. Please consult with legal counsel to ensure it meets your jurisdictional and business requirements.
      </p>
    </div>
  );
}