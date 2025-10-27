import React from "react";

export default function Careers() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Careers at EcoListing</h1>
      <p className="text-slate-600 text-lg mb-8">
        Join a team that’s redefining the future of real estate through technology, sustainability, and a shared passion for positive change.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Why Work With Us?</h2>
          <ul className="mt-2 text-slate-600 list-disc pl-6 space-y-2">
            <li>
              <strong>Purpose-Driven Mission:</strong> Make a direct impact by helping build a greener, healthier, and more transparent real estate market.
            </li>
            <li>
              <strong>Innovative Culture:</strong> Collaborate with talented professionals and thought leaders at the intersection of technology and sustainability.
            </li>
            <li>
              <strong>Growth & Learning:</strong> We invest in your ongoing development, supporting your ambitions both professionally and personally.
            </li>
            <li>
              <strong>Flexible & Inclusive:</strong> Enjoy a flexible work environment where diversity and individual perspectives are valued and celebrated.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Opportunities</h2>
          <p className="mt-2 text-slate-600">
            We’re always on the lookout for passionate engineers, designers, sustainability analysts, customer advocates, and real estate specialists. If you’re excited to join a dynamic and growing company, explore our current openings below.
          </p>
          <div className="bg-slate-50 rounded-md p-4 mt-4 border border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">Current Openings</h3>
            <ul className="mt-2 text-slate-600 list-disc pl-6">
              <li>
                <strong>Frontend Developer</strong> — React, TypeScript, experience with UI/UX and accessible web applications.
              </li>
              <li>
                <strong>Backend Engineer</strong> — Node.js, cloud infrastructure, API design, data security.
              </li>
              <li>
                <strong>Sustainability Analyst</strong> — Real estate data, green certifications, energy efficiency analysis.
              </li>
              <li>
                <strong>Customer Success Specialist</strong> — Real estate experience, excellent communication, client advocacy.
              </li>
            </ul>
            <p className="mt-3 text-slate-600">
              Don’t see your role? We welcome open applications from motivated individuals eager to contribute to our mission.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900">How to Apply</h2>
          <p className="mt-2 text-slate-600">
            Email your resume and a cover letter to <a href="mailto:careers@ecolisting.com" className="text-blue-600 underline">careers@ecolisting.com</a>.
            Tell us why you’re passionate about sustainable real estate and how you can help us make a difference.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Stay Updated</h2>
          <p className="mt-2 text-slate-600">
            We regularly post new roles and updates on our <a href="/blog" className="text-blue-600 underline">blog</a> and <a href="/newsletter" className="text-blue-600 underline">newsletter</a>.
            Follow us to learn more about our culture, values, and growth.
          </p>
        </section>
      </div>
    </div>
  );
}