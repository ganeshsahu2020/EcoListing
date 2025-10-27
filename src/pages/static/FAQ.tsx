import React from "react";

export default function FAQ() {
  const qas = [
    {
      q: "What is EcoListing?",
      a: (
        <>
          EcoListing is an advanced real estate platform dedicated to surfacing eco-friendly properties and empowering buyers, sellers, and agents with actionable sustainability insights and AI-driven market intelligence. We are committed to building a smarter, greener future—one home at a time.
        </>
      ),
    },
    {
      q: "How does EcoListing verify eco-friendly features?",
      a: (
        <>
          We combine data from verified green certifications, third-party audits, and detailed property disclosures. Our team reviews each listing for features such as energy-efficient systems, sustainable materials, renewable energy sources, and smart home technology.
        </>
      ),
    },
    {
      q: "How accurate are your market and price estimates?",
      a: (
        <>
          Our estimates leverage real-time listing data, local market comparables, and AI-powered trend analysis. While they provide a strong directional guide, we always recommend consulting a licensed appraiser or real estate professional for transactional decisions.
        </>
      ),
    },
    {
      q: "How can I save searches and receive alerts?",
      a: (
        <>
          Simply create a free EcoListing account and set your preferred filters. We’ll notify you by email whenever new or updated listings match your criteria, ensuring you never miss an opportunity.
        </>
      ),
    },
    {
      q: "Do you work with agents and brokers?",
      a: (
        <>
          Absolutely. Agents can build detailed profiles, showcase sustainable listings, and collaborate directly with buyers on our platform. We provide real-time lead notifications and advanced tools to streamline your workflow.
        </>
      ),
    },
    {
      q: "How do I list my eco-friendly property?",
      a: (
        <>
          Create an account and follow our guided listing process. We’ll help you highlight your property’s green features and connect you with a like-minded audience. Need assistance? Our support team is here to help at <a href="mailto:support@ecolisting.com" className="text-blue-600 underline">support@ecolisting.com</a>.
        </>
      ),
    },
    {
      q: "Is my personal information secure?",
      a: (
        <>
          Yes. We take privacy and data security seriously, employing industry-standard encryption and privacy protocols. Review our <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a> for details.
        </>
      ),
    },
    {
      q: "Where can I get additional support?",
      a: (
        <>
          Visit our <a href="/contact" className="text-blue-600 underline">Contact</a> page to reach out to our team. We’re available to help with inquiries, technical support, or partnership opportunities.
        </>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h1>
      <p className="text-slate-600 text-lg mb-8">
        Find quick, clear answers to common questions about EcoListing, our features, and our mission.<br />
        Still need help? <a href="/contact" className="text-blue-600 underline">Contact our support team</a>.
      </p>
      <div className="mt-8 space-y-4">
        {qas.map((item, i) => (
          <details
            key={i}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg"
          >
            <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900 transition">
              <span className="inline-flex items-center justify-between w-full">
                {item.q}
                <span className="ml-3 text-slate-400 transition-transform duration-300 group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <div className="mt-3 text-slate-600">{item.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}