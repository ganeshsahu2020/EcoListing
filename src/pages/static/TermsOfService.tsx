import React from "react";

export default function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-slate-600 text-lg mb-8">
        Welcome to EcoListing. Please read these Terms of Service (“Terms”) carefully before using our platform. By accessing or using EcoListing, you agree to be bound by these Terms and our Privacy Policy.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. Acceptance of Terms</h2>
          <p className="mt-2 text-slate-600">
            By accessing, browsing, or using the EcoListing website or services (“Services”), you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as any additional guidelines, policies, or rules provided by EcoListing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Eligibility & User Accounts</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>You must be at least 18 years old and have the legal authority to enter into these Terms.</li>
            <li>Account registration requires providing accurate, complete, and current information. You are responsible for all activities that occur under your account and for maintaining the security of your login credentials.</li>
            <li>EcoListing reserves the right to suspend or terminate accounts that violate these Terms or are found to be fraudulent or abusive.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">3. Use of the Platform</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>EcoListing is intended for personal, non-commercial use unless specifically authorized. You may access property listings, save favorites, request tours, and contact real estate agents through the platform.</li>
            <li>You agree not to misuse the Services, including but not limited to: scraping data, attempting unauthorized access, interfering with site operation, transmitting harmful code, or using the platform for unlawful purposes.</li>
            <li>Any use of automated scripts, bots, or data-mining tools is strictly prohibited.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Property Listings & Third Parties</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>EcoListing aggregates property data from multiple sources and third-party providers. While we strive for accuracy, we do not guarantee the completeness, reliability, or availability of listings.</li>
            <li>Any communications or transactions with agents, brokers, or service providers are solely between you and the third party. EcoListing is not responsible for any disputes, damages, or losses arising from such interactions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. User Content</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>You may submit content (e.g., reviews, questions, feedback) through the platform. By doing so, you grant EcoListing a worldwide, royalty-free, perpetual license to use, display, and distribute your content in connection with the Services.</li>
            <li>You are solely responsible for the content you submit and agree not to post anything unlawful, defamatory, misleading, or infringing on the rights of others.</li>
            <li>EcoListing reserves the right to moderate, edit, or remove user content at its discretion.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Intellectual Property</h2>
          <p className="mt-2 text-slate-600">
            All content and materials on EcoListing—including text, images, logos, software, and data—are owned by or licensed to EcoListing and protected by intellectual property laws. You may not copy, reproduce, republish, or exploit any content without our express written consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">7. Disclaimers & Limitation of Liability</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>EcoListing provides the Services “as is” and disclaims all warranties, express or implied, including merchantability or fitness for a particular purpose.</li>
            <li>We do not warrant that the Services will be uninterrupted, secure, error-free, or free of viruses.</li>
            <li>To the fullest extent permitted by law, EcoListing and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising from or related to the use of our Services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">8. Indemnification</h2>
          <p className="mt-2 text-slate-600">
            You agree to indemnify and hold harmless EcoListing, its affiliates, officers, agents, and employees from any claims, damages, liabilities, costs, or expenses arising from your use of the Services or violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">9. Modifications & Termination</h2>
          <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
            <li>EcoListing may update these Terms at any time. Continued use of the Services after changes constitutes acceptance of the new Terms.</li>
            <li>We reserve the right to terminate or suspend access to the Services at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or EcoListing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">10. Governing Law & Dispute Resolution</h2>
          <p className="mt-2 text-slate-600">
            These Terms are governed by the laws of the jurisdiction in which EcoListing operates. Any disputes arising out of these Terms or the Services will be resolved through binding arbitration or the courts in that jurisdiction, as permitted by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">11. Contact Information</h2>
          <p className="mt-2 text-slate-600">
            For questions regarding these Terms, please contact us at <a href="mailto:support@ecolisting.com" className="text-emerald-700 underline">support@ecolisting.com</a>.
          </p>
        </section>
      </div>

      <p className="mt-10 text-xs text-slate-500 italic">
        This Terms of Service document is provided as a professional template. Please consult legal counsel to adapt it for your organization and jurisdiction.
      </p>
    </div>
  );
}